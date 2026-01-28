# On your local machine:
ssh -t -L 8000:localhost:8000 root@159.65.185.62 'cd /var/www/html/staging && python3 -m http.server 8000'
