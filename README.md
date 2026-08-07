🚀 Incubation Management and Startup Ecosystem SystemAn enterprise-grade, full-stack incubation management and startup ecosystem platform engineered for real-time tenant lifecycle tracking, multi-role portal access, venture pitch evaluations, and secure role-based operational control (RBAC).Built with a robust Spring Boot backend, modern React frontend, and MySQL database, features automated startup onboarding, robust audit logging, and is fully automated via cloud infrastructure deployed on AWS EC2 behind an AWS Application Load Balancer (ALB) and NGINX Reverse Proxy.🏗️ System Architecture & WorkflowThe platform follows a layered production architecture designed for high availability, security, and scalable deployment on the AWS Cloud Environment.Plaintext+-------------------------------------------------------------------------------+
|                                   FRONTEND TIER                               |
|   +-----------------------------------------------------------------------+   |
|   |                   User Access Tiers (Web Portal)                      |   |
|   |                        (React.js + Vite Engine)                       |   |
|   +-----------------------------------------------------------------------+   |
+-----------------------------------++------------------------------------------+
                                    || HTTPS / HTTP Requests
                                    v
+-------------------------------------------------------------------------------+
|                       AWS PRODUCTION CLOUD ENVIRONMENT                        |
|                                                                               |
|   +-------------------------------------------------------------------------+ |
|   |           AWS Application Load Balancer (ALB DNS Entry)                 | |
|   +------------------------------------++-----------------------------------+ |
|                                        || Spans Multi-AZ Subnets              |
|            +--------------------------+--------------------------+            |
|            |                                                     |            |
|   +--------v----------------------------+            +---------v---------+  |
|   | Subnet 1 (us-east-1a)               |            | Subnet 2 / 3      |  |
|   | EC2 Node 1: NGINX + Spring Boot     |            | EC2 Node 2 (HA)   |  |
|   +--------------------++---------------+            +-------------------+  |
|                        || Verified API (/api/*)                               |
|   +--------------------v----------------------------------------------------+ |
|   | App Layer: Spring Boot Enterprise Core (Port 8080 - systemd Service)    | |
|   |   * REST Controllers (API Gateway & Web Security Filters)               | |
|   |   * Service Layer (Startup Incubation, Mentorship & Evaluation Engine)  | |
|   |   * Data Repositories (Spring Data JPA / Hibernate ORM)                 | |
|   +--------------------++----------------------------------------------------+ |
|                        || Secure DB Connections (Port 3306)                   |
|   +--------------------v----------------------------------------------------+ |
|   | Data Layer: AWS RDS (MySQL - Relational Tables)                         | |
|   +-------------------------------------------------------------------------+ |
+-------------------------------------------------------------------------------+
✨ Features & Capabilities🔐 Multi-Role Access Control (RBAC)ADMIN: Complete system oversight, user role management, incubator resource allocations, and global system audit logs.MENTOR / EVALUATOR: Startup pitch evaluations, milestone tracking, guidance sessions, and progress reporting.STARTUP / FOUNDER: Venture profile management, funding application submissions, resource request portals, and tracking incubation milestones.🏢 Incubation & Startup Lifecycle ManagementVenture Onboarding: Register startups with details including sector, founding team, funding stage, and incubation status.Milestone Tracking: Phase-wise tracking of startup growth, funding milestones, and program completion metrics.Resource Allocation: Dynamic management of incubator shared spaces, lab facilities, and advisory sessions.📊 Analytics & Audit LoggingSystem Audit Logs: Comprehensive tracking of user actions, role modifications, and system configuration updates for accountability.Operational Dashboard: Visual breakdown of active incubated startups, pending applications, and milestone achievements.🛡️ Security & Enterprise IntegrationJWT Authentication: Stateless, token-based authentication using JSON Web Tokens (JWT) with secure Bearer header authorization.Spring Security Authorization: Fine-grained endpoint protection restricting REST API routes based on specific user roles.CORS & Reverse Proxy Guard: Configured NGINX proxies with custom headers to prevent unauthorized cross-origin requests.🛠️ Tech Stack & ToolsLayer / CategoryTechnologies & ToolsFrontendReact.js, Vite, Tailwind CSS, Lucide Icons, AxiosBackendJava 17+, Spring Boot, Spring Security (JWT), Spring Data JPA, HibernateDatabaseMySQL 8.0 (AWS RDS / EC2 Hosted MySQL Instance)Web Server & Reverse ProxyNGINX, Systemd Services, Linux SecurityCloud Infrastructure & DevOpsAWS EC2 (Ubuntu), AWS Application Load Balancer (ALB), Target Groups, Multi-AZ SubnetsBuild Tools & UtilitiesMaven (pom.xml), Git, Node.js (v20), MobaXterm, Postman☁️ Production Deployment on AWS EC2 (Ubuntu)This project is deployed on an AWS EC2 Ubuntu Instance running Spring Boot as a systemd background service, React production build, and NGINX as a Reverse Proxy & Static File Host behind an AWS Application Load Balancer.🌐 Step 1: Server Update & Package InstallationUpdate local package repositories and install required dependencies:Bashsudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-17-jdk nginx git curl
⚙️ Step 2: Backend Deployment (Systemd Service)Compile the production JAR:Bashcd Backend
./mvnw clean package
Move JAR artifact to system directory and create the systemd service file (/etc/systemd/system/incubator.service):Ini, TOML[Unit]
Description=Incubation Management Spring Boot Backend Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/path/to/Backend
ExecStart=/usr/bin/java -jar target/incubator-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
Enable and start the service:Bashsudo systemctl daemon-reload
sudo systemctl enable incubator
sudo systemctl start incubator
💻 Step 3: Frontend Asset HostingBuild optimized React production files:Bashcd frontend
npm install && npm run build
Copy distribution files to NGINX root web directory:Bashsudo cp -r dist/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
🛡️ Step 4: NGINX Reverse Proxy ConfigurationConfigure NGINX (/etc/nginx/sites-available/default) to serve static assets and proxy API requests to Spring Boot:Nginxserver {
    listen 80;
    server_name _;

    root /var/www/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
Test and reload NGINX:Bashsudo nginx -t
sudo systemctl reload nginx
⚖️ High-Availability & Load Balancer Integration (AWS ALB)Multi-AZ Subnet Coverage: ALB spans multiple Availability Zones (us-east-1a, us-east-1b, us-east-1c) for network fault tolerance.Target Group & Health Checks: Configured with a root path / and success codes range 200-399 to monitor EC2 node health status.Security Group Hardening: Direct public traffic via raw IP/ports is restricted, routing all traffic securely through the ALB.🔗 Live Access🖥️ Public Load Balancer Endpoint: Access Incubator Portal
