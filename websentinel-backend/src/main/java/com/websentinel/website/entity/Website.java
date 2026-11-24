package com.websentinel.website.entity;

import com.websentinel.common.entity.BaseOrgEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "websites")
@Getter
@Setter
@NoArgsConstructor
public class Website extends BaseOrgEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 2048)
    private String url;

    @Column(nullable = false)
    private String host;

    @Column(name = "verification_method")
    private String verificationMethod; // DNS_TXT | HTML_FILE | META_TAG

    @Column(nullable = false)
    private boolean verified = false;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "authorization_attested_at")
    private Instant authorizationAttestedAt;

    @Column(name = "authorization_attested_ip", length = 45)
    private String authorizationAttestedIp;
}