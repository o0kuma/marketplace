package com.project.api.service;

/**
 * ISO 3166-1 alpha-2 country codes for shipping / payment rules.
 */
public final class ShippingCountry {

    public static final String KR = "KR";

    private ShippingCountry() {
    }

    /** Uppercase A–Z ×2; blank or invalid → {@link #KR}. */
    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return KR;
        }
        String u = raw.trim().toUpperCase();
        if (u.length() != 2 || !u.chars().allMatch(Character::isLetter)) {
            return KR;
        }
        return u;
    }

    public static boolean isDomestic(String normalizedCountry, String domesticCode) {
        String d = domesticCode != null && domesticCode.length() == 2
                ? domesticCode.trim().toUpperCase()
                : KR;
        return normalize(normalizedCountry).equals(d);
    }
}
