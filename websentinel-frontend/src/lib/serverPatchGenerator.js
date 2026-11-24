/**
 * WebSentinel AI Remediation Copilot - Server Patch Generator
 * Generates production-ready configuration snippets across Nginx, Apache, Cloudflare, Next.js, and Caddy.
 */

export const SUPPORTED_SERVERS = [
  { id: 'nginx', name: 'Nginx', ext: 'conf', defaultFile: '/etc/nginx/conf.d/security_headers.conf' },
  { id: 'apache', name: 'Apache HTTPD', ext: 'htaccess', defaultFile: '.htaccess or /etc/apache2/conf-available/security.conf' },
  { id: 'cloudflare', name: 'Cloudflare WAF / Rules', ext: 'json', defaultFile: 'Cloudflare Dashboard > Rules > Transform Rules' },
  { id: 'nextjs', name: 'Next.js App', ext: 'js', defaultFile: 'next.config.mjs or middleware.ts' },
  { id: 'caddy', name: 'Caddy 2', ext: 'caddyfile', defaultFile: 'Caddyfile' },
]

function identifyVulnerabilityType(title = '', desc = '') {
  const t = (title + ' ' + desc).toLowerCase()
  if (t.includes('hsts') || t.includes('strict-transport-security')) return 'HSTS'
  if (t.includes('content-security-policy') || t.includes('csp')) return 'CSP'
  if (t.includes('x-frame-options') || t.includes('clickjacking') || t.includes('frame-ancestors')) return 'FRAME_OPTIONS'
  if (t.includes('x-content-type-options') || t.includes('nosniff') || t.includes('mime')) return 'MIME_SNIFF'
  if (t.includes('referrer-policy')) return 'REFERRER'
  if (t.includes('permissions-policy') || t.includes('feature-policy')) return 'PERMISSIONS'
  if (t.includes('server') && (t.includes('leak') || t.includes('header') || t.includes('x-powered-by') || t.includes('version'))) return 'SERVER_LEAK'
  if (t.includes('cookie') || t.includes('httponly') || t.includes('samesite') || t.includes('secure flag')) return 'COOKIE_FLAGS'
  if (t.includes('tls') || t.includes('ssl') || t.includes('cipher') || t.includes('handshake')) return 'TLS_HARDENING'
  return 'GENERIC'
}

export function generateServerPatch(finding, serverType = 'nginx') {
  const vuln = identifyVulnerabilityType(finding?.title, finding?.description)
  const targetHost = finding?.host || 'yourdomain.com'

  switch (vuln) {
    case 'HSTS':
      return generateHstsPatch(serverType, targetHost)
    case 'CSP':
      return generateCspPatch(serverType, targetHost)
    case 'FRAME_OPTIONS':
      return generateFrameOptionsPatch(serverType, targetHost)
    case 'MIME_SNIFF':
      return generateMimeSniffPatch(serverType, targetHost)
    case 'REFERRER':
      return generateReferrerPatch(serverType, targetHost)
    case 'PERMISSIONS':
      return generatePermissionsPatch(serverType, targetHost)
    case 'SERVER_LEAK':
      return generateServerLeakPatch(serverType, targetHost)
    case 'COOKIE_FLAGS':
      return generateCookieFlagsPatch(serverType, targetHost)
    case 'TLS_HARDENING':
      return generateTlsPatch(serverType, targetHost)
    default:
      return generateGenericSecurityPatch(serverType, finding, targetHost)
  }
}

// 1. HSTS (Strict-Transport-Security)
function generateHstsPatch(server, host) {
  if (server === 'nginx') {
    return {
      server: 'Nginx',
      filePath: '/etc/nginx/conf.d/security_headers.conf',
      title: 'HTTP Strict Transport Security (HSTS) - 2 Year Preload',
      code: `# Enforce TLS 1.2+ and prevent SSL-stripping MITM attacks
# max-age=63072000 (2 years), applies to subdomains, eligible for Chrome HSTS preload list
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;`,
      reloadCommand: 'sudo nginx -t && sudo systemctl reload nginx',
      verifyCommand: `curl -sI https://${host} | grep -i "strict-transport-security"`,
      explanation: 'Instructs modern browsers to communicate exclusively over HTTPS, mitigating SSL-stripping and cookie interception.'
    }
  }
  if (server === 'apache') {
    return {
      server: 'Apache',
      filePath: '.htaccess or /etc/apache2/conf-available/security.conf',
      title: 'Apache mod_headers HSTS Enforcer',
      code: `<IfModule mod_headers.c>
    # 2 years expiry + subdomains + preload submission
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
</IfModule>`,
      reloadCommand: 'sudo a2enmod headers && sudo systemctl restart apache2',
      verifyCommand: `curl -sI https://${host} | grep -i "strict-transport-security"`,
      explanation: 'Applies Strict-Transport-Security header to all incoming requests via Apache mod_headers.'
    }
  }
  if (server === 'cloudflare') {
    return {
      server: 'Cloudflare',
      filePath: 'Dashboard > SSL/TLS > Edge Certificates > HSTS',
      title: 'Cloudflare Edge HSTS Policy',
      code: `// Cloudflare Managed HSTS Configuration:
// 1. Status: Enable HSTS
// 2. Max-Age: 2 years (63,072,000 seconds)
// 3. Include subdomains: ON
// 4. Preload: ON
// 5. No-Sniff: ON

// Or via Cloudflare Transform Rules (HTTP Response Header Modification):
Header Name: Strict-Transport-Security
Header Value: max-age=63072000; includeSubDomains; preload`,
      reloadCommand: 'Edge changes take effect within 15-30 seconds globally.',
      verifyCommand: `curl -sI https://${host} | grep -i "strict-transport-security"`,
      explanation: 'Cloudflare Edge injects HSTS at every edge POP globally before delivering HTML to visitors.'
    }
  }
  if (server === 'nextjs') {
    return {
      server: 'Next.js',
      filePath: 'next.config.mjs (or next.config.js)',
      title: 'Next.js Custom Security Headers Configuration',
      code: `/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default nextConfig`,
      reloadCommand: 'npm run build && pm2 restart all (or redeploy to Vercel/Node)',
      verifyCommand: `curl -sI https://${host} | grep -i "strict-transport-security"`,
      explanation: 'Next.js route pipeline attaches the HSTS policy to all server-rendered pages and API routes.'
    }
  }
  return {
    server: 'Caddy',
    filePath: 'Caddyfile',
    title: 'Caddy 2 Automatic HTTPS & HSTS',
    code: `${host} {
    header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    reverse_proxy localhost:3000
}`,
    reloadCommand: 'caddy reload',
    verifyCommand: `curl -sI https://${host} | grep -i "strict-transport-security"`,
    explanation: 'Caddy natively provisions TLS certificates and automatically serves Strict-Transport-Security.'
  }
}

// 2. CSP (Content-Security-Policy)
function generateCspPatch(server, host) {
  const defaultCsp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'self';"

  if (server === 'nginx') {
    return {
      server: 'Nginx',
      filePath: '/etc/nginx/conf.d/security_headers.conf',
      title: 'Nginx Content Security Policy (XSS Mitigation)',
      code: `# Defend against Cross-Site Scripting (XSS) and Clickjacking injection
add_header Content-Security-Policy "${defaultCsp}" always;`,
      reloadCommand: 'sudo nginx -t && sudo systemctl reload nginx',
      verifyCommand: `curl -sI https://${host} | grep -i "content-security-policy"`,
      explanation: 'Restricts script, stylesheet, and asset sources to eliminate Cross-Site Scripting (XSS) attacks.'
    }
  }
  if (server === 'apache') {
    return {
      server: 'Apache',
      filePath: '.htaccess',
      title: 'Apache mod_headers Content-Security-Policy',
      code: `<IfModule mod_headers.c>
    Header always set Content-Security-Policy "${defaultCsp}"
</IfModule>`,
      reloadCommand: 'sudo a2enmod headers && sudo systemctl restart apache2',
      verifyCommand: `curl -sI https://${host} | grep -i "content-security-policy"`,
      explanation: 'Establishes a defense-in-depth perimeter against malicious remote scripts.'
    }
  }
  if (server === 'cloudflare') {
    return {
      server: 'Cloudflare',
      filePath: 'Rules > Transform Rules > Modify Response Header',
      title: 'Cloudflare Transform Rule - CSP Injection',
      code: `When incoming requests match:
  (http.host eq "${host}")

Then modify response headers:
  Set dynamic/static header:
    Name: Content-Security-Policy
    Value: ${defaultCsp}`,
      reloadCommand: 'Rule deploys globally across Cloudflare edge nodes in seconds.',
      verifyCommand: `curl -sI https://${host} | grep -i "content-security-policy"`,
      explanation: 'Cloudflare edge automatically injects the CSP header into all origin responses.'
    }
  }
  if (server === 'nextjs') {
    return {
      server: 'Next.js',
      filePath: 'next.config.mjs',
      title: 'Next.js Content-Security-Policy Header',
      code: `const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "${defaultCsp}",
          },
        ],
      },
    ]
  },
}
export default nextConfig`,
      reloadCommand: 'npm run build && npm run start',
      verifyCommand: `curl -sI https://${host} | grep -i "content-security-policy"`,
      explanation: 'Applies Content-Security-Policy across all Next.js routes and dynamic SSR pages.'
    }
  }
  return {
    server: 'Caddy',
    filePath: 'Caddyfile',
    title: 'Caddy 2 CSP Header',
    code: `${host} {
    header Content-Security-Policy "${defaultCsp}"
    reverse_proxy localhost:3000
}`,
    reloadCommand: 'caddy reload',
    verifyCommand: `curl -sI https://${host} | grep -i "content-security-policy"`,
    explanation: 'Configures Caddy web server to inject the CSP defense header.'
  }
}

// 3. Clickjacking (X-Frame-Options)
function generateFrameOptionsPatch(server, host) {
  if (server === 'nginx') {
    return {
      server: 'Nginx',
      filePath: '/etc/nginx/conf.d/security_headers.conf',
      title: 'Nginx Anti-Clickjacking Defense',
      code: `# Disallow framing inside unauthorized <iframe> embeds
add_header X-Frame-Options "SAMEORIGIN" always;`,
      reloadCommand: 'sudo nginx -t && sudo systemctl reload nginx',
      verifyCommand: `curl -sI https://${host} | grep -i "x-frame-options"`,
      explanation: 'Prevents invisible iframe overlay clickjacking attacks by restricting framing to the same origin.'
    }
  }
  if (server === 'apache') {
    return {
      server: 'Apache',
      filePath: '.htaccess',
      title: 'Apache X-Frame-Options',
      code: `<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>`,
      reloadCommand: 'sudo systemctl reload apache2',
      verifyCommand: `curl -sI https://${host} | grep -i "x-frame-options"`,
      explanation: 'Blocks third-party sites from framing your authenticated pages.'
    }
  }
  if (server === 'cloudflare') {
    return {
      server: 'Cloudflare',
      filePath: 'Rules > Transform Rules',
      title: 'Cloudflare Anti-Clickjacking Header',
      code: `Modify Response Header:
  Name: X-Frame-Options
  Value: SAMEORIGIN`,
      reloadCommand: 'Immediate edge deployment',
      verifyCommand: `curl -sI https://${host} | grep -i "x-frame-options"`,
      explanation: 'Injects X-Frame-Options at edge POPs globally.'
    }
  }
  if (server === 'nextjs') {
    return {
      server: 'Next.js',
      filePath: 'next.config.mjs',
      title: 'Next.js Anti-Clickjacking Header',
      code: `const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ]
  },
}
export default nextConfig`,
      reloadCommand: 'npm run build',
      verifyCommand: `curl -sI https://${host} | grep -i "x-frame-options"`,
      explanation: 'Configures Next.js header pipeline to prevent framing.'
    }
  }
  return {
    server: 'Caddy',
    filePath: 'Caddyfile',
    title: 'Caddy X-Frame-Options',
    code: `${host} {
    header X-Frame-Options "SAMEORIGIN"
}`,
    reloadCommand: 'caddy reload',
    verifyCommand: `curl -sI https://${host} | grep -i "x-frame-options"`,
    explanation: 'Caddy sets SAMEORIGIN frame policy.'
  }
}

// 4. MIME-Sniffing (X-Content-Type-Options)
function generateMimeSniffPatch(server, host) {
  if (server === 'nginx') {
    return {
      server: 'Nginx',
      filePath: '/etc/nginx/conf.d/security_headers.conf',
      title: 'Nginx X-Content-Type-Options Nosniff',
      code: `# Prevent browser MIME-sniffing away from declared content-type
add_header X-Content-Type-Options "nosniff" always;`,
      reloadCommand: 'sudo nginx -t && sudo systemctl reload nginx',
      verifyCommand: `curl -sI https://${host} | grep -i "x-content-type-options"`,
      explanation: 'Stops browsers from treating user-uploaded images or text files as executable JavaScript.'
    }
  }
  if (server === 'apache') {
    return {
      server: 'Apache',
      filePath: '.htaccess',
      title: 'Apache MIME-Sniff Defense',
      code: `<IfModule mod_headers.c>
    Header always set X-Content-Type-Options "nosniff"
</IfModule>`,
      reloadCommand: 'sudo systemctl reload apache2',
      verifyCommand: `curl -sI https://${host} | grep -i "x-content-type-options"`,
      explanation: 'Enforces strict MIME-type handling in Apache.'
    }
  }
  if (server === 'cloudflare') {
    return {
      server: 'Cloudflare',
      filePath: 'Rules > Transform Rules',
      title: 'Cloudflare Nosniff Header',
      code: `Modify Response Header:
  Name: X-Content-Type-Options
  Value: nosniff`,
      reloadCommand: 'Immediate edge deployment',
      verifyCommand: `curl -sI https://${host} | grep -i "x-content-type-options"`,
      explanation: 'Injects nosniff header on all Cloudflare edge responses.'
    }
  }
  if (server === 'nextjs') {
    return {
      server: 'Next.js',
      filePath: 'next.config.mjs',
      title: 'Next.js X-Content-Type-Options',
      code: `const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}
export default nextConfig`,
      reloadCommand: 'npm run build',
      verifyCommand: `curl -sI https://${host} | grep -i "x-content-type-options"`,
      explanation: 'Prevents MIME-confusion attacks across all Next.js assets.'
    }
  }
  return {
    server: 'Caddy',
    filePath: 'Caddyfile',
    title: 'Caddy Nosniff Policy',
    code: `${host} {
    header X-Content-Type-Options "nosniff"
}`,
    reloadCommand: 'caddy reload',
    verifyCommand: `curl -sI https://${host} | grep -i "x-content-type-options"`,
    explanation: 'Caddy enforces nosniff policy.'
  }
}

// 5. Referrer-Policy
function generateReferrerPatch(server, host) {
  return {
    server: server.toUpperCase(),
    filePath: server === 'nginx' ? '/etc/nginx/conf.d/security.conf' : server === 'apache' ? '.htaccess' : 'Configuration File',
    title: 'Strict Referrer Policy Hardening',
    code: server === 'nginx' 
      ? `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`
      : server === 'apache'
      ? `<IfModule mod_headers.c>\n    Header always set Referrer-Policy "strict-origin-when-cross-origin"\n</IfModule>`
      : `header Referrer-Policy "strict-origin-when-cross-origin"`,
    reloadCommand: server === 'nginx' ? 'sudo nginx -t && sudo systemctl reload nginx' : 'sudo systemctl reload apache2',
    verifyCommand: `curl -sI https://${host} | grep -i "referrer-policy"`,
    explanation: 'Ensures URL query parameters containing sensitive tokens or credentials are not leaked to external third-party domains.'
  }
}

// 6. Permissions-Policy
function generatePermissionsPatch(server, host) {
  const policy = 'camera=(), microphone=(), geolocation=(), payment=()'
  return {
    server: server.toUpperCase(),
    filePath: server === 'nginx' ? '/etc/nginx/conf.d/security.conf' : '.htaccess',
    title: 'Permissions-Policy (Browser Feature Quarantine)',
    code: server === 'nginx'
      ? `add_header Permissions-Policy "${policy}" always;`
      : `<IfModule mod_headers.c>\n    Header always set Permissions-Policy "${policy}"\n</IfModule>`,
    reloadCommand: server === 'nginx' ? 'sudo nginx -t && sudo systemctl reload nginx' : 'sudo systemctl reload apache2',
    verifyCommand: `curl -sI https://${host} | grep -i "permissions-policy"`,
    explanation: 'Disables access to browser camera, microphone, and location hardware unless explicitly authorized.'
  }
}

// 7. Server Header Leak (Information Disclosure)
function generateServerLeakPatch(server, host) {
  if (server === 'nginx') {
    return {
      server: 'Nginx',
      filePath: '/etc/nginx/nginx.conf',
      title: 'Nginx Version Obfuscation',
      code: `# Hide Nginx version number from HTTP banner headers and error pages
http {
    server_tokens off;
    ...
}`,
      reloadCommand: 'sudo nginx -t && sudo systemctl reload nginx',
      verifyCommand: `curl -sI https://${host} | grep -i "server"`,
      explanation: 'Prevents automated vulnerability scanners from fingerprinting vulnerable web server versions.'
    }
  }
  if (server === 'apache') {
    return {
      server: 'Apache',
      filePath: '/etc/apache2/conf-available/security.conf',
      title: 'Apache Banner Obfuscation',
      code: `# Strip detailed OS and Apache build versions
ServerTokens Prod
ServerSignature Off`,
      reloadCommand: 'sudo systemctl restart apache2',
      verifyCommand: `curl -sI https://${host} | grep -i "server"`,
      explanation: 'Configures Apache to only report "Apache" without OS platform or module version details.'
    }
  }
  if (server === 'nextjs') {
    return {
      server: 'Next.js',
      filePath: 'next.config.mjs',
      title: 'Next.js X-Powered-By Obfuscation',
      code: `const nextConfig = {
  // Disable the x-powered-by: Next.js response header
  poweredByHeader: false,
}
export default nextConfig`,
      reloadCommand: 'npm run build && npm run start',
      verifyCommand: `curl -sI https://${host} | grep -i "x-powered-by"`,
      explanation: 'Stops Next.js from emitting the x-powered-by framework fingerprint.'
    }
  }
  return {
    server: 'Caddy',
    filePath: 'Caddyfile',
    title: 'Caddy Server Header Stripping',
    code: `${host} {
    # Remove Server header from HTTP response
    header -Server
}`,
    reloadCommand: 'caddy reload',
    verifyCommand: `curl -sI https://${host} | grep -i "server"`,
    explanation: 'Completely strips the Server header from HTTP responses.'
  }
}

// 8. Cookie Flags (Missing HttpOnly / Secure / SameSite)
function generateCookieFlagsPatch(server, host) {
  if (server === 'nginx') {
    return {
      server: 'Nginx',
      filePath: '/etc/nginx/conf.d/security.conf',
      title: 'Nginx Reverse Proxy Cookie Flags Injection',
      code: `# Automatically append Secure, HttpOnly, and SameSite=Lax flags to all upstream cookies
proxy_cookie_flags ~* samesite=lax secure httponly;`,
      reloadCommand: 'sudo nginx -t && sudo systemctl reload nginx',
      verifyCommand: `curl -sI https://${host} | grep -i "set-cookie"`,
      explanation: 'Guarantees that session cookies cannot be read via JavaScript (XSS) and are only transmitted over TLS.'
    }
  }
  if (server === 'apache') {
    return {
      server: 'Apache',
      filePath: '.htaccess',
      title: 'Apache mod_headers Set-Cookie Modifier',
      code: `<IfModule mod_headers.c>
    # Append HttpOnly, Secure and SameSite=Lax to Set-Cookie headers
    Header edit Set-Cookie ^(.*)$ "$1; HttpOnly; Secure; SameSite=Lax"
</IfModule>`,
      reloadCommand: 'sudo systemctl reload apache2',
      verifyCommand: `curl -sI https://${host} | grep -i "set-cookie"`,
      explanation: 'Intercepts Set-Cookie headers and attaches modern browser security flags.'
    }
  }
  return {
    server: 'Node.js / Express / Next.js',
    filePath: 'Route Handler / Server Action',
    title: 'Cookie Security Configuration',
    code: `// When setting cookies in Next.js / Express:
cookies().set({
  name: 'session_token',
  value: token,
  httpOnly: true,                               // Blocks XSS cookie theft
  secure: process.env.NODE_ENV === 'production', // Transmitted strictly over HTTPS
  sameSite: 'lax',                              // Defends against CSRF attacks
  maxAge: 60 * 60 * 24 * 7,                     // 7 days
  path: '/',
});`,
    reloadCommand: 'npm run build',
    verifyCommand: `curl -sI https://${host} | grep -i "set-cookie"`,
    explanation: 'Protects authentication tokens from client-side script tampering and cross-site request forgery.'
  }
}

// 9. TLS Hardening
function generateTlsPatch(server, host) {
  if (server === 'nginx') {
    return {
      server: 'Nginx',
      filePath: '/etc/nginx/conf.d/ssl.conf',
      title: 'Nginx Modern TLSv1.3 & Cipher Suite Configuration',
      code: `# Decommission legacy TLS 1.0/1.1; enforce TLS 1.2+ and modern AEAD ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;`,
      reloadCommand: 'sudo nginx -t && sudo systemctl reload nginx',
      verifyCommand: `openssl s_client -connect ${host}:443 -tls1_3`,
      explanation: 'Configures modern TLS 1.3 cryptographic suites and eliminates vulnerable legacy ciphers (RC4, 3DES, CBC).'
    }
  }
  return {
    server: 'Apache',
    filePath: '/etc/apache2/mods-available/ssl.conf',
    title: 'Apache SSLProtocol & SSLCipherSuite Hardening',
    code: `# Disable outdated SSL/TLS versions
SSLProtocol -all +TLSv1.2 +TLSv1.3
SSLCipherSuite HIGH:!aNULL:!MD5:!3DES:!CAMELLIA:!RC4
SSLHonorCipherOrder on`,
    reloadCommand: 'sudo systemctl restart apache2',
    verifyCommand: `openssl s_client -connect ${host}:443 -tls1_3`,
    explanation: 'Restricts Apache to modern authenticated encryption ciphers.'
  }
}

// 10. Generic Security Patch
function generateGenericSecurityPatch(server, finding, host) {
  return {
    server: server.toUpperCase(),
    filePath: server === 'nginx' ? '/etc/nginx/conf.d/security.conf' : '.htaccess',
    title: `Remediation Patch for ${finding?.title || 'Security Finding'}`,
    code: `# Recommended Mitigation for: ${finding?.title || 'Security Finding'}
# Description: ${finding?.description || 'N/A'}
#
${finding?.remediation || '# Follow standard security documentation to remediate.'}`,
    reloadCommand: server === 'nginx' ? 'sudo nginx -t && sudo systemctl reload nginx' : 'sudo systemctl reload apache2',
    verifyCommand: `curl -sI https://${host}`,
    explanation: finding?.remediation || 'Apply the recommended configuration changes to resolve this finding.'
  }
}
