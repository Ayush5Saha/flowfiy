import base64, sys, os

def save_b64(name, b64_data):
    folder = r"E:\CodeX Developemt\AI_Sales_outbound_system\ad-video\screenshots"
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, f"{name}.jpg")
    with open(path, 'wb') as f:
        f.write(base64.b64decode(b64_data))
    print(f"Saved: {path} ({len(b64_data)} chars b64)")
    return path

if __name__ == "__main__":
    name = sys.argv[1]
    b64 = sys.argv[2]
    save_b64(name, b64)
