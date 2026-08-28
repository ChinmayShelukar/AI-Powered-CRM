package com.cortexcrm;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;

@SpringBootTest
@ContextConfiguration(initializers = AbstractIntegrationTest.Initializer.class)
class CortexBackendApplicationTests extends AbstractIntegrationTest {

	@Test
	void contextLoads() {
	}

}
