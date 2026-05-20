package com.citewise.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class RestClientConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        
        // Timeouts are set in milliseconds
        factory.setConnectTimeout(10000); // 10 seconds to connect to n8n
        factory.setReadTimeout(120000);   // 120 seconds to wait for AI processing
        
        return new RestTemplate(factory);
    }
}