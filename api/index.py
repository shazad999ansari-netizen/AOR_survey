import os
import sys

# Ensure root workspace directory is in Python path for Vercel serverless imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app as _app

# Export ASGI app for Vercel Serverless Python
app = _app
handler = _app
