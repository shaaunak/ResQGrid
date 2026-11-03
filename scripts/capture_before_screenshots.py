import urllib.request
import json
import asyncio
import websockets
import base64
import os

routes = [
    ("overview", "/"),
    ("command", "/command"),
    ("mission_trace", "/mission-trace"),
    ("citizen", "/citizen"),
    ("track", "/track"),
    ("responder", "/responder"),
    ("inventory", "/inventory"),
    ("scenarios", "/scenarios"),
    ("analytics", "/analytics"),
    ("evidence", "/evidence"),
    ("audit", "/audit"),
    ("health", "/health"),
    ("docs", "/docs"),
    ("login", "/login"),
]

viewports = [
    ("1440", 1440, 900),
    ("1024", 1024, 768),
    ("390", 390, 844),
]

themes = [
    ("light", False),
    ("dark", True),
]

# Get JWT token for operator
login_data = json.dumps({"email": "operator@resqgrid.org", "password": "Emergency@2026"}).encode("utf-8")
req = urllib.request.Request("http://127.0.0.1:8000/api/v1/auth/login", data=login_data, headers={"Content-Type": "application/json"})
token_resp = json.loads(urllib.request.urlopen(req).read().decode("utf-8"))
token = token_resp["access_token"]
user_obj = {
    "id": token_resp["user_id"],
    "email": "operator@resqgrid.org",
    "role": token_resp["role"],
    "full_name": token_resp["full_name"],
}
user_str = json.dumps(user_obj)

out_dir = "/Users/shaaunak/ccl/docs/evidence/ui/before"
os.makedirs(out_dir, exist_ok=True)

async def capture_all():
    print(f"Starting screenshot capture for {len(routes)} routes across {len(viewports)} viewports and {len(themes)} themes...")
    
    # Open a single CDP session tab
    req = urllib.request.Request("http://localhost:9222/json/new?http://localhost:5173/login", method="PUT")
    tab = json.loads(urllib.request.urlopen(req).read().decode("utf-8"))
    tab_id = tab["id"]
    ws_url = tab["webSocketDebuggerUrl"]
    
    try:
        async with websockets.connect(ws_url, max_size=50*1024*1024) as ws:
            msg_id = 0
            
            async def send_cmd(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "method": method}
                if params:
                    payload["params"] = params
                await ws.send(json.dumps(payload))
                curr_id = msg_id
                while True:
                    raw = await ws.recv()
                    msg = json.loads(raw)
                    if msg.get("id") == curr_id:
                        return msg.get("result")
            
            await send_cmd("Page.enable")
            await send_cmd("DOM.enable")
            
            # Inject auth token into localStorage
            inject_auth_js = f"""
                localStorage.setItem('token', '{token}');
                localStorage.setItem('user', JSON.stringify({user_str}));
            """
            await send_cmd("Runtime.evaluate", {"expression": inject_auth_js})
            
            for rname, rpath in routes:
                for vname, width, height in viewports:
                    for tname, is_dark in themes:
                        filename = f"{rname}_{vname}_{tname}.png"
                        filepath = os.path.join(out_dir, filename)
                        
                        # Set viewport
                        await send_cmd("Emulation.setDeviceMetricsOverride", {
                            "width": width,
                            "height": height,
                            "deviceScaleFactor": 1,
                            "mobile": (width <= 400),
                        })
                        
                        # Navigate
                        await send_cmd("Page.navigate", {"url": f"http://localhost:5173{rpath}"})
                        await asyncio.sleep(1.0)
                        
                        # Set theme in html class and localStorage
                        theme_js = f"""
                            if ({'true' if is_dark else 'false'}) {{
                                document.documentElement.classList.add('dark');
                                localStorage.setItem('theme', 'dark');
                            }} else {{
                                document.documentElement.classList.remove('dark');
                                localStorage.setItem('theme', 'light');
                            }}
                        """
                        await send_cmd("Runtime.evaluate", {"expression": theme_js})
                        await asyncio.sleep(0.4)
                        
                        # Capture screenshot
                        res = await send_cmd("Page.captureScreenshot", {"format": "png"})
                        if res and "data" in res:
                            img_data = base64.b64decode(res["data"])
                            with open(filepath, "wb") as f:
                                f.write(img_data)
                            print(f"Captured: {filename} ({len(img_data)} bytes)")
                        else:
                            print(f"Failed to capture: {filename}")
                            
    finally:
        try:
            urllib.request.urlopen(f"http://localhost:9222/json/close/{tab_id}")
        except Exception:
            pass

asyncio.run(capture_all())
