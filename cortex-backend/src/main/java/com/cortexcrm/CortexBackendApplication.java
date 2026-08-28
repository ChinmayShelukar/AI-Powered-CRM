package com.cortexcrm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CortexBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(CortexBackendApplication.class, args);
	}

}
