import express from "express";

const app = express();
app.use(express.json());

// Health check endpoint for testing
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "kmp-main-server",
    port: 3000 
  });
});

// Basic test endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "KMP Main Server is running",
    version: "1.0.0",
    endpoints: {
      health: "/api/health"
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 KMP Main Server listening on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
}); 