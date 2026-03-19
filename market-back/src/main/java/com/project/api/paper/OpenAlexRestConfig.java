package com.project.api.paper;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class OpenAlexRestConfig {

    @Bean
    @Qualifier("openAlexRestTemplate")
    public RestTemplate openAlexRestTemplate(OpenAlexProperties props) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        int t = Math.max(props.getGraphTimeoutMs(), props.getSearchTimeoutMs());
        f.setConnectTimeout(Math.min(t, 15000));
        f.setReadTimeout(t);
        return new RestTemplate(f);
    }
}
