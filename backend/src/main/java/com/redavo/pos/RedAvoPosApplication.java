package com.redavo.pos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RedAvoPosApplication {

    public static void main(String[] args) {
        SpringApplication.run(RedAvoPosApplication.class, args);
    }
}
