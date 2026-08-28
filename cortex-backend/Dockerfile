# syntax=docker/dockerfile:1
# CortexCRM backend — build context = cortex-backend/ (standalone module).

# --- Build stage ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./
RUN mvn -q -o dependency:go-offline 2>/dev/null || mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q clean package -DskipTests
RUN cp target/*-SNAPSHOT.jar /app/app.jar 2>/dev/null || cp target/*.jar /app/app.jar

# --- Runtime stage ---
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/app.jar app.jar
# Host (Render) injects $PORT; default 8080. DB/JWT/Redis/Claude via env.
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -jar app.jar --server.port=${PORT}"]
