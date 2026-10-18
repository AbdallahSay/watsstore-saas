# ==========================================
# WatsStore SaaS - Backend Multi-Stage Dockerfile
# Runtime: .NET 8 ASP.NET Core Web API
# ==========================================

# Stage 1: Build & Publish
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies (layer cached)
COPY WatsStore.Api.csproj ./
RUN dotnet restore WatsStore.Api.csproj

# Copy remaining source files and compile
COPY . ./
RUN dotnet publish WatsStore.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Production Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Ensure persistent uploads directory exists for merchant media
RUN mkdir -p /app/wwwroot/uploads

# Copy published binaries
COPY --from=build /app/publish .

# Expose port and configure environment
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000

ENTRYPOINT ["dotnet", "WatsStore.Api.dll"]
