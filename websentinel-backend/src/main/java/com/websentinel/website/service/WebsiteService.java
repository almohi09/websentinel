package com.websentinel.website.service;

import com.websentinel.common.entity.BaseOrgEntity;
import com.websentinel.common.exception.AccessDeniedException;
import com.websentinel.common.exception.ResourceNotFoundException;
import com.websentinel.scanner.entity.Scan;
import com.websentinel.scanner.repository.ScanRepository;
import com.websentinel.scanner.safety.UrlSafetyValidator;
import com.websentinel.website.dto.*;
import com.websentinel.website.entity.Website;
import com.websentinel.website.repository.WebsiteRepository;
import com.websentinel.workspace.entity.OrganizationMember;
import com.websentinel.workspace.repository.OrganizationMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import javax.naming.Context;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.net.URI;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class WebsiteService {

    private final WebsiteRepository websiteRepository;
    private final ScanRepository scanRepository;
    private final OrganizationMemberRepository memberRepository;
    private final WebClient.Builder webClientBuilder;

    public WebsiteService(WebsiteRepository websiteRepository,
                          ScanRepository scanRepository,
                          OrganizationMemberRepository memberRepository,
                          WebClient.Builder webClientBuilder) {
        this.websiteRepository = websiteRepository;
        this.scanRepository = scanRepository;
        this.memberRepository = memberRepository;
        this.webClientBuilder = webClientBuilder;
    }

    // ---------- helpers ----------

    private void requireMembership(UUID orgId, UUID userId) {
        memberRepository.findByOrganizationIdAndUserId(orgId, userId)
            .orElseThrow(() -> new AccessDeniedException("You are not a member of this organization"));
    }

    private Website getOrThrow(UUID id) {
        return websiteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Website not found: " + id));
    }

    private WebsiteResponse toResponse(Website w) {
        WebsiteResponse r = new WebsiteResponse();
        r.setId(w.getId());
        r.setUrl(w.getUrl());
        r.setHost(w.getHost());
        r.setVerificationMethod(w.getVerificationMethod());
        r.setVerified(w.isVerified());
        r.setVerifiedAt(w.getVerifiedAt());
        r.setVerificationToken(w.getVerificationToken());
        r.setAuthorizationAttested(w.getAuthorizationAttestedAt() != null);
        r.setCreatedAt(w.getCreatedAt());
        return r;
    }

    private String hostOf(String url) {
        return URI.create(url).getHost();
    }

    // ---------- add ----------

    public WebsiteResponse add(UUID orgId, UUID userId, AddWebsiteRequest req, String clientIp) {
        requireMembership(orgId, userId);

        // Safety: validate URL (SSRF protection)
        UrlSafetyValidator.validate(req.getUrl());

        if (!req.isAttestAuthorization()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "You must attest authorization over the target website");
        }

        String method = req.getVerificationMethod();
        if (!Set.of("DNS_TXT", "HTML_FILE", "META_TAG").contains(method)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification method: " + method);
        }

        Website w = new Website();
        w.setOrganizationId(orgId);
        w.setUrl(req.getUrl());
        w.setHost(hostOf(req.getUrl()));
        w.setVerificationMethod(method);
        w.setVerificationToken(UUID.randomUUID().toString());
        w.setAuthorizationAttestedAt(Instant.now());
        w.setAuthorizationAttestedIp(clientIp);
        websiteRepository.save(w);
        return toResponse(w);
    }

    // ---------- list ----------

    public List<WebsiteResponse> list(UUID orgId, UUID userId) {
        requireMembership(orgId, userId);
        return websiteRepository.findByOrganizationIdAndDeletedAtIsNull(orgId).stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    // ---------- get ----------

    public WebsiteResponse get(UUID websiteId, UUID userId) {
        Website w = getOrThrow(websiteId);
        requireMembership(w.getOrganizationId(), userId);
        if (w.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Website not found: " + websiteId);
        }
        return toResponse(w);
    }

    // ---------- remove (soft delete) ----------

    public void remove(UUID websiteId, UUID userId) {
        Website w = getOrThrow(websiteId);
        requireMembership(w.getOrganizationId(), userId);
        w.setDeletedAt(Instant.now());
        websiteRepository.save(w);
    }

    // ---------- verify ownership ----------

    public WebsiteResponse verify(UUID websiteId, UUID userId) {
        Website w = getOrThrow(websiteId);
        requireMembership(w.getOrganizationId(), userId);

        boolean ok = switch (w.getVerificationMethod()) {
            case "DNS_TXT" -> verifyDnsTxt(w);
            case "HTML_FILE" -> verifyHtmlFile(w);
            case "META_TAG" -> verifyMetaTag(w);
            default -> false;
        };

        if (ok) {
            w.setVerified(true);
            w.setVerifiedAt(Instant.now());
            websiteRepository.save(w);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Verification failed. Ensure the token is correctly placed.");
        }
        return toResponse(w);
    }

    private boolean verifyDnsTxt(Website w) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.dns.DnsContextFactory");
            env.put(Context.PROVIDER_URL, "dns://");
            DirContext ctx = new InitialDirContext(env);
            Attributes attrs = ctx.getAttributes(w.getHost(), new String[]{"TXT"});
            javax.naming.directory.Attribute txt = attrs.get("TXT");
            if (txt == null) return false;
            for (int i = 0; i < txt.size(); i++) {
                Object val = txt.get(i);
                if (val != null && val.toString().contains(w.getVerificationToken())) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean verifyHtmlFile(Website w) {
        String url = w.getUrl().replaceAll("/$", "") + "/websentinel-verify.txt";
        try {
            String body = webClientBuilder.build().get().uri(url)
                .retrieve().bodyToMono(String.class).block();
            return body != null && body.contains(w.getVerificationToken());
        } catch (Exception e) {
            return false;
        }
    }

    private boolean verifyMetaTag(Website w) {
        try {
            String body = webClientBuilder.build().get().uri(w.getUrl())
                .retrieve().bodyToMono(String.class).block();
            if (body == null) return false;
            String token = w.getVerificationToken();
            // look for meta tag with content containing token
            return body.toLowerCase().contains("websentinel-verification")
                && body.contains(token);
        } catch (Exception e) {
            return false;
        }
    }

    // ---------- scan history ----------

    public List<com.websentinel.scanner.dto.ScanResponse> scanHistory(UUID websiteId, UUID userId) {
        Website w = getOrThrow(websiteId);
        requireMembership(w.getOrganizationId(), userId);
        return scanRepository.findByWebsiteId(websiteId).stream().map(s -> {
            com.websentinel.scanner.dto.ScanResponse r = new com.websentinel.scanner.dto.ScanResponse();
            r.setId(s.getId());
            r.setWebsiteId(s.getWebsiteId());
            r.setScanType(s.getScanType());
            r.setStatus(s.getStatus());
            r.setStartedAt(s.getStartedAt());
            r.setCompletedAt(s.getCompletedAt());
            r.setErrorMessage(s.getErrorMessage());
            return r;
        }).collect(Collectors.toList());
    }
}