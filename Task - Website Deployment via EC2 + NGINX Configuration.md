# Task: Website Deployment via EC2 + NGINX Configuration

A basic website was deployed to an AWS EC2 instance. To ensure the application remains running continuously in the background, it was configured and managed using **PM2**.

Additionally, **NGINX** was successfully set up and is fully working as a reverse proxy to route traffic to the application (refer to the `nginx.conf` file for the exact configuration).

### Load Balancing & Networking Setup
To ensure high availability and proper traffic routing, the following AWS infrastructure was configured:
- **Application Load Balancer (ALB)**: An internet-facing ALB (`omer-astrovibe-alb`) was created across multiple Availability Zones (`us-east-2a`, `us-east-2b`) to receive and distribute incoming HTTP traffic.
- **Target Group**: A Target Group (`omer-nginx-tg-8080`) was configured on port `8080` and successfully registered the EC2 instance (`i-07b9426bccc3d7660`), which is currently passing health checks and marked as **Healthy**.
- **Security Groups**: Appropriate security groups were created to restrict inbound and outbound traffic, ensuring the ALB can safely communicate with the EC2 instance while securely exposing the application to the internet.



Please check the directory: Internship-Project/Task: Website Deployment via EC2 + NGINX Configuration
