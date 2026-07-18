import sys
import os

# Ensure the parent directory (backend) is in the Python namespace so Vercel can resolve 'main' and 'routers' imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
