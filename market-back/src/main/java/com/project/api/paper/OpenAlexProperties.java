package com.project.api.paper;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.openalex")
public class OpenAlexProperties {

    /** Base URL without trailing slash */
    private String baseUrl = "https://api.openalex.org";

    /**
     * Contact for User-Agent polite pool (https://docs.openalex.org/how-to-use/rate-limits).
     * Example: your@email.com
     */
    private String contactEmail = "";

    private int searchTimeoutMs = 20000;
    private int graphTimeoutMs = 25000;

    /** Max reference / citation neighbors per graph */
    private int graphRefsLimit = 12;
    private int graphCitesLimit = 12;
}
