# =========================================================
# Smart Campus Hub - Backend Dockerfile
# Two stages so the final image stays small.
# =========================================================

# ---------- Stage 1: build the jar ----------
# Java 24 to match the project's pom.xml (java.version=24)
FROM maven:3-eclipse-temurin-24 AS build

WORKDIR /app

# Copy only the pom first so Maven can cache dependencies.
# This makes the second build much faster.
COPY pom.xml .
RUN mvn -B dependency:go-offline

# Now copy the source and build the jar
COPY src ./src
RUN mvn -B clean package -DskipTests


# ---------- Stage 2: run the jar ----------
# Use the JDK image (no JRE-only image is published for Java 24 yet)
FROM eclipse-temurin:24-jdk

WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Make sure the upload folder exists inside the container.
# Module C (tickets) will save image attachments here.
RUN mkdir -p /app/uploads/tickets

# Run as an unprivileged user.
RUN useradd --system --uid 1001 --home /app appuser \
 && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

# Start Spring Boot
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
