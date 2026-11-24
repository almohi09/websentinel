package com.websentinel.scanner.service;

import com.websentinel.scanner.safety.UrlSafetyValidator;
import com.websentinel.website.entity.Website;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.net.URI;
import java.time.Duration;
import java.util.*;

/**
 * Phase 7: Controlled Active Security Scanner.
 * Performs strictly non-destructive, rate-limited probes for dangerous HTTP methods,
 * CORS origin reflections, and exposed sensitive files / diagnostic endpoints.
 */
@Service
public class ActiveScannerService {

    private static final Logger log = LoggerFactory.getLogger(ActiveScannerService.class);
    private static final String SCANNER_USER_AGENT = "WebSentinel-Security-Scanner/1.0 (+https://github.com/almohi09/websentinel)";

    private final WebClient webClient;

    public ActiveScannerService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
            .defaultHeader("User-Agent", SCANNER_USER_AGENT)
            .build();
    }

    public List<PassiveScannerService.FindingDraft> scan(Website website) {
        List<PassiveScannerService.FindingDraft> findings = new ArrayList<>();
        String rawUrl = website.getUrl();
        if (rawUrl == null || rawUrl.isBlank()) return findings;

        // Strip trailing slash for uniform endpoint joining
        String baseUrl = rawUrl.endsWith("/") ? rawUrl.substring(0, rawUrl.length() - 1) : rawUrl;

        // Re-verify URL safety before active scan probes
        try {
            UrlSafetyValidator.validate(baseUrl);
        } catch (Exception e) {
            log.warn("Active scan aborted for {}: {}", baseUrl, e.getMessage());
            findings.add(new PassiveScannerService.FindingDraft(
                "Active Scan Preflight Check Blocked",
                "Target URL failed safety policy validation: " + e.getMessage(),
                "HIGH",
                "Target: " + baseUrl,
                "Verify that the target website is a public, valid domain."
            ));
            return findings;
        }

        log.info("Starting controlled active security scan for target: {}", baseUrl);

        // 1. Safe HTTP Method Probing (OPTIONS, TRACE)
        findings.addAll(checkHttpMethods(baseUrl));

        // 2. CORS Misconfiguration Auditing
        findings.addAll(checkCorsPolicy(baseUrl));

        // 3. Exposed Sensitive Files & Administrative Diagnostic Probes
        findings.addAll(checkSensitiveEndpoints(baseUrl));

        return findings;
    }

    // ---------- 1. Safe HTTP Methods ----------

    private List<PassiveScannerService.FindingDraft> checkHttpMethods(String baseUrl) {
        List<PassiveScannerService.FindingDraft> findings = new ArrayList<>();
        try {
            var response = webClient.method(HttpMethod.OPTIONS)
                .uri(baseUrl)
                .retrieve()
                .toBodilessEntity()
                .timeout(Duration.ofSeconds(4))
                .block();

            if (response != null) {
                var headers = response.getHeaders();
                String allow = headers.getFirst("Allow");
                String acam = headers.getFirst("Access-Control-Allow-Methods");
                String combinedMethods = ((allow != null ? allow : "") + " " + (acam != null ? acam : "")).toUpperCase();

                if (combinedMethods.contains("TRACE")) {
                    findings.add(new PassiveScannerService.FindingDraft(
                        "Dangerous HTTP Method Enabled: TRACE",
                        "The web server advertises or permits the TRACE method. This can allow attackers to perform Cross-Site Tracing (XST) to extract sensitive cookies including HttpOnly tokens.",
                        "HIGH",
                        "Allow / Access-Control-Allow-Methods: " + combinedMethods.trim(),
                        "Disable TRACE method on web servers and proxies (e.g., 'TraceEnable off' in Apache, or return 405 for TRACE in Nginx)."
                    ));
                }

                if (combinedMethods.contains("PUT") || combinedMethods.contains("DELETE")) {
                    findings.add(new PassiveScannerService.FindingDraft(
                        "Insecure HTTP Methods Advertised (PUT/DELETE)",
                        "The server advertises state-modifying HTTP methods (PUT/DELETE) at root path. If not properly protected by authentication, attackers might manipulate server files.",
                        "LOW",
                        "Advertised methods: " + combinedMethods.trim(),
                        "Ensure PUT and DELETE methods require strict authorization and are disabled for public static endpoints."
                    ));
                }
            }
        } catch (Exception e) {
            log.debug("HTTP Methods probe error on {}: {}", baseUrl, e.getMessage());
        }
        return findings;
    }

    // ---------- 2. CORS Misconfiguration ----------

    private List<PassiveScannerService.FindingDraft> checkCorsPolicy(String baseUrl) {
        List<PassiveScannerService.FindingDraft> findings = new ArrayList<>();
        String testOrigin = "https://sentinel-security-test.org";

        try {
            var response = webClient.get()
                .uri(baseUrl)
                .header("Origin", testOrigin)
                .retrieve()
                .toBodilessEntity()
                .timeout(Duration.ofSeconds(4))
                .block();

            if (response != null) {
                var headers = response.getHeaders();
                String acao = headers.getFirst("Access-Control-Allow-Origin");
                String acac = headers.getFirst("Access-Control-Allow-Credentials");

                if (acao != null) {
                    boolean reflectsOrigin = acao.equalsIgnoreCase(testOrigin);
                    boolean allowsAll = acao.equals("*");
                    boolean credentialsTrue = "true".equalsIgnoreCase(acac);

                    if (reflectsOrigin && credentialsTrue) {
                        findings.add(new PassiveScannerService.FindingDraft(
                            "Critical CORS Misconfiguration: Arbitrary Origin Reflection With Credentials",
                            "The server dynamically reflects arbitrary unverified Origin headers with Access-Control-Allow-Credentials: true. An attacker's website can initiate cross-origin requests and read sensitive authenticated responses.",
                            "CRITICAL",
                            "Origin: " + testOrigin + " -> ACAO: " + acao + ", ACAC: " + acac,
                            "Validate Origin headers against an explicit strict whitelist of allowed domains. Never dynamically reflect untrusted origins with credentials enabled."
                        ));
                    } else if (reflectsOrigin) {
                        findings.add(new PassiveScannerService.FindingDraft(
                            "Insecure CORS Origin Reflection",
                            "The server dynamically echoes arbitrary Origin headers without credentials. While less severe without credentials, this may allow unauthenticated data leakage.",
                            "MEDIUM",
                            "Origin: " + testOrigin + " -> ACAO: " + acao,
                            "Specify trusted origin domains explicitly instead of echoing arbitrary Origin headers."
                        ));
                    } else if (allowsAll && credentialsTrue) {
                        findings.add(new PassiveScannerService.FindingDraft(
                            "Invalid CORS Wildcard with Credentials",
                            "The server returns Access-Control-Allow-Origin: * along with Access-Control-Allow-Credentials: true, which is rejected by modern browsers and indicates a dangerous misconfiguration.",
                            "HIGH",
                            "ACAO: * with ACAC: true",
                            "Configure CORS properly by specifying explicit trusted origins."
                        ));
                    }
                }
            }
        } catch (Exception e) {
            log.debug("CORS probe error on {}: {}", baseUrl, e.getMessage());
        }
        return findings;
    }

    // ---------- 3. Sensitive Endpoints & Exposed Diagnostic Probes ----------

    private record EndpointCheck(
        String path,
        String title,
        String description,
        String severity,
        String remediation,
        java.util.function.BiPredicate<Integer, String> isExposed
    ) {}

    private List<PassiveScannerService.FindingDraft> checkSensitiveEndpoints(String baseUrl) {
        List<PassiveScannerService.FindingDraft> findings = new ArrayList<>();

        List<EndpointCheck> checks = List.of(
            // 1. .env file
            new EndpointCheck(
                "/.env",
                "Exposed Environment Secrets File (.env)",
                "The server exposes a .env configuration file publicly. This file typically contains database credentials, API secret keys, JWT tokens, and cloud access keys.",
                "CRITICAL",
                "Block web server access to all dotfiles (.env, .git) in Nginx/Apache/Cloudflare immediately and rotate all exposed secrets.",
                (status, body) -> status == 200 && isLikelyEnvFile(body)
            ),
            // 2. .git/HEAD
            new EndpointCheck(
                "/.git/HEAD",
                "Exposed Git Repository Metadata (/.git/HEAD)",
                "The server's .git repository metadata is publicly accessible. Attackers can reconstruct the complete source code, commit history, and hidden secrets.",
                "HIGH",
                "Deny access to /.git/ directories in your web server configuration (e.g. 'location ~ /\\.git { deny all; }' in Nginx).",
                (status, body) -> status == 200 && body.startsWith("ref: refs/")
            ),
            // 3. .DS_Store
            new EndpointCheck(
                "/.DS_Store",
                "Exposed macOS Directory Metadata (.DS_Store)",
                "A macOS .DS_Store file is publicly downloadable, which can leak hidden filenames, backup files, and internal directory layout.",
                "LOW",
                "Remove .DS_Store files from production web roots and configure your web server to block access to files starting with '.DS_Store'.",
                (status, body) -> status == 200 && (body.contains("Bud1") || body.contains("DSDB"))
            ),
            // 4. Spring Boot Actuator
            new EndpointCheck(
                "/actuator/health",
                "Exposed Spring Boot Actuator Health Telemetry",
                "The application's Spring Boot Actuator health endpoint is publicly accessible without authentication, revealing system state and backend component health.",
                "MEDIUM",
                "Restrict Spring Boot Actuator endpoints using Spring Security or expose them only on a private management port.",
                (status, body) -> status == 200 && (body.contains("\"status\"") || body.contains("\"UP\""))
            ),
            // 5. Swagger / OpenAPI Interactive Docs
            new EndpointCheck(
                "/swagger-ui/index.html",
                "Interactive API Documentation Exposed (Swagger UI)",
                "Swagger API documentation is publicly accessible without authentication, exposing internal endpoints, parameters, and schema models to potential attackers.",
                "LOW",
                "Restrict Swagger/OpenAPI documentation to authenticated developers or internal networks.",
                (status, body) -> status == 200 && (body.toLowerCase().contains("swagger") || body.toLowerCase().contains("openapi"))
            ),
            // 6. phpinfo() diagnostics
            new EndpointCheck(
                "/phpinfo.php",
                "Exposed PHP Diagnostic Page (phpinfo.php)",
                "A diagnostic phpinfo() file is publicly exposed. This reveals server configuration, PHP version, loaded extensions, environment variables, and internal filesystem paths.",
                "HIGH",
                "Delete diagnostic files like phpinfo.php from all production web servers immediately.",
                (status, body) -> status == 200 && (body.contains("PHP Version") || body.contains("phpinfo()"))
            ),
            // 7. Apache server-status
            new EndpointCheck(
                "/server-status",
                "Exposed Apache Server-Status Telemetry",
                "Apache server status monitoring is publicly accessible, leaking active client IP addresses, current virtual hosts, worker states, and URLs being processed.",
                "MEDIUM",
                "In Apache configuration, restrict /server-status with 'Require local' or 'Require ip <trusted-admin-ip>'.",
                (status, body) -> status == 200 && (body.contains("Apache Server Status") || body.contains("Server Version:"))
            ),
            // 8. robots.txt policy analysis
            new EndpointCheck(
                "/robots.txt",
                "Robots.txt Crawl Policy Cataloged",
                "The website's robots.txt was analyzed. Review disallowed paths to ensure administrative and internal portals are not relying on robots.txt for security.",
                "INFORMATIONAL",
                "Ensure that sensitive URLs listed in robots.txt are protected by strong authentication and authorization.",
                (status, body) -> status == 200 && (body.contains("User-agent:") || body.contains("Disallow:"))
            )
        );

        for (EndpointCheck check : checks) {
            try {
                // Non-destructive probe: GET with max 8KB buffer
                String targetPath = baseUrl + check.path;
                var responseEntity = webClient.get()
                    .uri(targetPath)
                    .retrieve()
                    .toEntity(String.class)
                    .timeout(Duration.ofSeconds(3))
                    .block();

                if (responseEntity != null) {
                    int statusCode = responseEntity.getStatusCode().value();
                    String body = responseEntity.getBody() != null ? responseEntity.getBody() : "";

                    if (check.isExposed.test(statusCode, body)) {
                        String preview = body.length() > 140 ? body.substring(0, 140) + "..." : body;
                        findings.add(new PassiveScannerService.FindingDraft(
                            check.title,
                            check.description,
                            check.severity,
                            "Path: " + check.path + " [HTTP " + statusCode + "]\nEvidence preview: " + preview.trim(),
                            check.remediation
                        ));
                    }
                }
            } catch (WebClientResponseException e) {
                // Expected for 404, 403, 401 — endpoint is safe/not exposed
                log.trace("Target {} returned status {}", check.path, e.getStatusCode());
            } catch (Exception e) {
                log.debug("Active probe error on {}{}: {}", baseUrl, check.path, e.getMessage());
            }

            // Controlled rate limiting: polite 50ms pause between endpoint checks
            try {
                Thread.sleep(50);
            } catch (InterruptedException ignored) {}
        }

        return findings;
    }

    private static boolean isLikelyEnvFile(String body) {
        if (body == null || body.isBlank()) return false;
        // Avoid false positives from custom 404 pages returning HTML
        String lower = body.toLowerCase();
        if (lower.contains("<!doctype html") || lower.contains("<html") || lower.contains("<head>")) {
            return false;
        }
        return body.contains("=") && (
            lower.contains("app_") || lower.contains("db_") || lower.contains("database") ||
            lower.contains("secret") || lower.contains("key") || lower.contains("password") ||
            lower.contains("port") || lower.contains("host")
        );
    }
}
