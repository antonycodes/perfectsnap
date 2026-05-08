import urllib.request
import json
import base64

url = "https://api.cloudinary.com/v1_1/antony12/resources/search"
auth = base64.b64encode(b"469491542346813:A2KAZ_tYF_fXuOveXM7AeWPxGm4").decode('utf-8')

data = json.dumps({"expression": "resource_type:image", "max_results": 20, "sort_by": [{"created_at": "desc"}]}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={"Authorization": "Basic " + auth, "Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req) as f:
        res = json.loads(f.read().decode('utf-8'))
        for r in res.get('resources', []):
            print(f"{r['public_id']} -> {r['secure_url']}")
except Exception as e:
    print(e)
