package com.websentinel.scanner.service;

import com.websentinel.website.entity.Website;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URI;
import java.security.cert.X509Certificate;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PassiveScannerService {

    private final WebClient.Builder webClientBuilder;

    public PassiveScannerService(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    public static class FindingDraft {
        public String title;
        public String description;
        public String severity;
        public String evidence;
        public String remediation;

        public FindingDraft(String title, String description, String severity, String evidence, String remediation) {
            this.title = title;
            this.description = description;
            this.severity = severity;
            this.evidence = evidence;
            this.remediation = remediation;
        }
    }

    public List<FindingDraft> scan(Website website) {
        List<FindingDraft> findings = new ArrayList<>();
        String url = website.getUrl();
        String host = website.getHost();

        // 1. HTTPS availability
        boolean isHttps = url.toLowerCase().startsWith("https://");
        if (!isHttps) {
            findings.add(new FindingDraft(
                "HTTPS Not Enabled",
                "The website is served over plain HTTP. Data in transit is not encrypted.",
                "HIGH",
                "URL scheme: http",
                "Enable HTTPS with a valid TLS certificate. Redirect all HTTP traffic to HTTPS."
            ));
        } else {
            // 2. TLS assessment
            findings.addAll(checkTls(host));
        }

        // 3. HTTP fetch + headers + cookies
        findings.addAll(checkHttp(url, isHttps));

        // 4. DNS check
        findings.addAll(checkDns(host));

        return findings;
    }

    // ---------- TLS ----------

    private List<FindingDraft> checkTls(String host) {
        List<FindingDraft> findings = new ArrayList<>();
        try {
            SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
            try (SSLSocket socket = (SSLSocket) factory.createSocket()) {
                socket.connect(new InetSocketAddress(host, 443), 5000);
                socket.startHandshake();
                String protocol = socket.getSession().getProtocol();
                X509Certificate leaf = (X509Certificate) socket.getSession().getPeerCertificates()[0];

                Date now = new Date();
                if (leaf.getNotAfter().before(now)) {
                    findings.add(new FindingDraft(
                        "TLS Certificate Expired",
                        "The server's TLS certificate has expired.",
                        "CRITICAL",
                        "NotAfter: " + leaf.getNotAfter(),
                        "Renew the TLS certificate immediately."
                    ));
                } else {
                    long days = (leaf.getNotAfter().getTime() - now.getTime()) / (1000L * 60 * 60 * 24);
                    if (days < 30) {
                        findings.add(new FindingDraft(
                            "TLS Certificate Expiring Soon",
                            "The TLS certificate expires within 30 days.",
                            "MEDIUM",
                            "Expires in " + days + " days (" + leaf.getNotAfter() + ")",
                            "Renew the TLS certificate before expiry."
                        ));
                    }
                }

                if ("TLSv1".equals(protocol) || "TLSv1.1".equals(protocol)) {
                    findings.add(new FindingDraft(
                        "Weak TLS Protocol",
                        "The server supports an outdated TLS version.",
                        "HIGH",
                        "Protocol: " + protocol,
                        "Disable TLS 1.0/1.1; enable TLS 1.2+ (prefer 1.3)."
                    ));
                }

                // issuer info
                findings.add(new FindingDraft(
                    "TLS Certificate Valid",
                    "TLS handshake succeeded. Certificate: " + leaf.getSubjectX500Principal().getName(),
                    "INFORMATIONAL",
                    "Issuer: " + leaf.getIssuerX500Principal().getName() + ", Protocol: " + protocol,
                    "No action required."
                ));
            }
        } catch (Exception e) {
            findings.add(new FindingDraft(
                "TLS Handshake Failed",
                "Could not establish a TLS connection to the server.",
                "HIGH",
                "Error: " + e.getMessage(),
                "Verify the TLS certificate chain and server configuration."
            ));
        }
        return findings;
    }

    // ---------- HTTP headers + cookies ----------

    private List<FindingDraft> checkHttp(String url, boolean isHttps) {
        List<FindingDraft> findings = new ArrayList<>();
        try {
            var response = webClientBuilder.build().get().uri(url)
                .retrieve().toBodilessEntity().block();
            if (response == null) return findings;

            var headers = response.getHeaders();

            // Status
            if (response.getStatusCode().isError()) {
                findings.add(new FindingDraft(
                    "HTTP Error Status",
                    "The website returned an error HTTP status.",
                    "MEDIUM",
                    "Status: " + response.getStatusCode(),
                    "Investigate server errors."
                ));
            }

            // Security headers
            checkHeader(findings, headers, "Strict-Transport-Security", "HSTS Missing",
                "The Strict-Transport-Security header is not set.",
                "MEDIUM", "Add HSTS header with max-age >= 31536000; includeSubDomains; preload.",
                present -> {
                    String v = headers.getFirst("Strict-Transport-Security");
                    if (v == null || !v.toLowerCase().contains("max-age")) return "HSTS header present but missing max-age.";
                    return null;
                });

            checkHeader(findings, headers, "Content-Security-Policy", "Content Security Policy Missing",
                "No Content-Security-Policy header. Vulnerable to XSS/injection.",
                "MEDIUM", "Define a Content-Security-Policy restricting script/style sources.");

            checkHeader(findings, headers, "X-Content-Type-Options", "X-Content-Type-Options Missing",
                "X-Content-Type-Options not set to nosniff.",
                "MEDIUM", "Set X-Content-Type-Options: nosniff.",
                present -> {
                    String v = headers.getFirst("X-Content-Type-Options");
                    if (v == null || !v.equalsIgnoreCase("nosniff")) return "X-Content-Type-Options is not 'nosniff'.";
                    return null;
                });

            checkHeader(findings, headers, "X-Frame-Options", "Clickjacking Protection Missing",
                "X-Frame-Options not set. Site may be framed (clickjacking).",
                "MEDIUM", "Set X-Frame-Options: DENY or SAMEORIGIN (or use CSP frame-ancestors).");

            checkHeader(findings, headers, "Referrer-Policy", "Referrer-Policy Missing",
                "Referrer-Policy not set; may leak referrer data.",
                "LOW", "Set Referrer-Policy: strict-origin-when-cross-origin (or stricter).");

            checkHeader(findings, headers, "Permissions-Policy", "Permissions-Policy Missing",
                "Permissions-Policy not set.",
                "LOW", "Set Permissions-Policy to restrict browser features.");

            // Information disclosure
            String server = headers.getFirst("Server");
            if (server != null && !server.isBlank()) {
                findings.add(new FindingDraft(
                    "Server Header Discloses Software",
                    "The Server header reveals web server software/version.",
                    "LOW",
                    "Server: " + server,
                    "Remove or genericize the Server header."
                ));
            }
            String poweredBy = headers.getFirst("X-Powered-By");
            if (poweredBy != null && !poweredBy.isBlank()) {
                findings.add(new FindingDraft(
                    "X-Powered-By Header Discloses Technology",
                    "X-Powered-By reveals backend technology.",
                    "LOW",
                    "X-Powered-By: " + poweredBy,
                    "Remove the X-Powered-By header."
                ));
            }

            // Cookies
            List<String> setCookies = headers.get("Set-Cookie");
            if (setCookies != null) {
                for (String cookie : setCookies) {
                    String lower = cookie.toLowerCase();
                    if (isHttps && !lower.contains("secure")) {
                        findings.add(new FindingDraft(
                            "Cookie Missing Secure Attribute",
                            "A cookie is set without the Secure flag over HTTPS.",
                            "MEDIUM",
                            "Set-Cookie: " + cookie,
                            "Add Secure attribute to all cookies."
                        ));
                    }
                    if (!lower.contains("httponly")) {
                        findings.add(new FindingDraft(
                            "Cookie Missing HttpOnly Attribute",
                            "A cookie is accessible via JavaScript (XSS risk).",
                            "MEDIUM",
                            "Set-Cookie: " + cookie,
                            "Add HttpOnly attribute to session cookies."
                        ));
                    }
                    if (!lower.contains("samesite")) {
                        findings.add(new FindingDraft(
                            "Cookie Missing SameSite Attribute",
                            "Cookie has no SameSite attribute (CSRF risk).",
                            "LOW",
                            "Set-Cookie: " + cookie,
                            "Set SameSite=Lax or Strict."
                        ));
                    }
                }
            }

            // If all good, add informational
            findings.add(new FindingDraft(
                "HTTP Security Headers Assessed",
                "Passive HTTP header and cookie analysis completed.",
                "INFORMATIONAL",
                "Status: " + response.getStatusCode() + ", Headers: " + headers.size(),
                "Review findings above."
            ));

        } catch (Exception e) {
            findings.add(new FindingDraft(
                "HTTP Request Failed",
                "Could not fetch the website.",
                "HIGH",
                "Error: " + e.getMessage(),
                "Verify the URL is reachable and not blocking automated requests."
            ));
        }
        return findings;
    }

    private void checkHeader(List<FindingDraft> findings, org.springframework.http.HttpHeaders headers,
                             String headerName, String title, String desc, String severity, String remediation) {
        checkHeader(findings, headers, headerName, title, desc, severity, remediation, null);
    }

    private void checkHeader(List<FindingDraft> findings, org.springframework.http.HttpHeaders headers,
                             String headerName, String title, String desc, String severity, String remediation,
                             java.util.function.Function<String, String> extraCheck) {
        String value = headers.getFirst(headerName);
        if (value == null || value.isBlank()) {
            findings.add(new FindingDraft(title, desc, severity, headerName + ": (missing)", remediation));
        } else if (extraCheck != null) {
            String issue = extraCheck.apply(value);
            if (issue != null) {
                findings.add(new FindingDraft(title + " (Misconfigured)", issue, "LOW",
                    headerName + ": " + value, remediation));
            }
        }
    }

    // ---------- DNS ----------

    private List<FindingDraft> checkDns(String host) {
        List<FindingDraft> findings = new ArrayList<>();
        try {
            InetAddress addr = InetAddress.getByName(host);
            findings.add(new FindingDraft(
                "DNS Resolution Successful",
                "Host resolved to an IP address.",
                "INFORMATIONAL",
                "Resolved: " + addr.getHostAddress(),
                "No action required."
            ));
        } catch (Exception e) {
            findings.add(new FindingDraft(
                "DNS Resolution Failed",
                "Could not resolve the hostname.",
                "HIGH",
                "Error: " + e.getMessage(),
                "Verify the domain's DNS configuration."
            ));
        }
        return findings;
    }
}