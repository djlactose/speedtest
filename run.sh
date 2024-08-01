#!/bin/bash

# Run the application with Gunicorn
gunicorn -w 4 -b 0.0.0.0:80 main:app
