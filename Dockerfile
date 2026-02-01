FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libldap2-dev \
    libsasl2-dev \
    && rm -rf /var/lib/apt/lists/*

# Create directory for certificates
RUN mkdir -p /etc/ldap/certs

# Copy your certificate
COPY ./ldap-cert-chain.crt /etc/ldap/certs/ldap-cert-chain.crt

# Copy your full certificate chain (PEM file with root + intermediates)
COPY ./ldap-cert-chain.crt /usr/local/share/ca-certificates/ad-ca.crt

# Install the certificate into the system trust store
RUN update-ca-certificates

# Add to LDAP config (optional but often required)
RUN echo "TLS_CACERT /etc/ssl/certs/ca-certificates.crt" >> /etc/ldap/ldap.conf

# Set proper permissions
RUN chmod 644 /etc/ldap/certs/ldap-cert-chain.crt
RUN chown ${UID:-1000}:${GID:-1000} /etc/ldap/certs/ldap-cert-chain.crt

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000