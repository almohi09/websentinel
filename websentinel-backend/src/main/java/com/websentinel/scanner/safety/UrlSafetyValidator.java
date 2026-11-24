package com.websentinel.scanner.safety;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.Set;

/**
 * Validates target URLs for scanner safety: scheme, host resolution, and IP-range blocks.
 * Mitigates SSRF and DNS rebinding (Threat Model T1, T2).
 */
public class UrlSafetyValidator {

    private static final Set<String> BLOCKED_HOSTS = Set.of(
        "localhost", "127.0.0.1", "::1", "0.0.0.0",
        "169.254.169.254", "metadata.google.internal"
    );

    public static void validate(String rawUrl) {
        URI uri;
        try {
            uri = URI.create(rawUrl);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid URL");
        }
        String scheme = uri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
            throw new IllegalArgumentException("Only http/https URLs are allowed");
        }
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("URL must have a host");
        }
        if (BLOCKED_HOSTS.contains(host.toLowerCase())) {
            throw new IllegalArgumentException("Host is blocked");
        }
        // Resolve and check IP ranges (SSRF protection)
        try {
            InetAddress addr = InetAddress.getByName(host);
            if (isBlockedAddress(addr)) {
                throw new IllegalArgumentException("Resolved IP is in a blocked range");
            }
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("Unable to resolve host");
        }
    }

    private static boolean isBlockedAddress(InetAddress addr) {
        if (addr.isLoopbackAddress()) return true;
        if (addr.isLinkLocalAddress()) return true;
        if (addr.isSiteLocalAddress()) return true;     // 10.x, 172.16-31.x, 192.168.x
        if (addr.isAnyLocalAddress()) return true;
        byte[] b = addr.getAddress();
        // 169.254.0.0/16 (link-local) already covered; also block 100.64.0.0/10 (CGNAT)
        if (b.length == 4 && (b[0] & 0xFF) == 100 && ((b[1] & 0xFF) & 0xC0) == 64) return true;
        return false;
    }

    /** Re-validate a redirect destination by re-resolving DNS (anti-rebinding). */
    public static void validateRedirect(String redirectUrl, String originalHost) {
        validate(redirectUrl);
        // Additional check: ensure redirect doesn't change host to a blocked one (already in validate)
    }
}