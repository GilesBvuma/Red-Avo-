# ── Build stage ──────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Cache dependencies: this layer only re-runs when pom.xml changes.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B package -DskipTests

# ── Runtime stage ────────────────────────────────────────────────
FROM eclipse-temurin:17-jre
WORKDIR /app

RUN useradd --system --create-home spring \
    && mkdir /uploads \
    && chown spring:spring /uploads

COPY --from=build /build/target/*.jar app.jar

USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
