# ─── Stage 1: Builder ────────────────────────────────────────────────────────
# Install all Python dependencies into an isolated prefix so only the
# compiled site-packages (no pip cache, no wheel files) are copied forward.
FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Step 1 — Install fastembed with all its deps (onnxruntime, tokenizers,
# huggingface-hub, pillow, loguru, mmh3, PyStemmer, snowballstemmer, etc.)
# The image is already ~870 MB without chromadb, so all fastembed deps fit
# well under the 1 GB target even when installed normally.
RUN pip install --no-cache-dir --prefix=/install fastembed==0.3.6

# Step 2 — Install remaining application dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
# Lean final image: only the installed packages + app source, nothing else.
FROM python:3.11-slim AS runtime

WORKDIR /app

# git is needed at runtime by gitpython for repository cloning/pulling
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
    && rm -rf /var/lib/apt/lists/*

# Copy only the installed packages from the builder stage
COPY --from=builder /install /usr/local

# Copy application source (. is already filtered by .dockerignore)
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]