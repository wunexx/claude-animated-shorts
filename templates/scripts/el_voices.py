# ElevenLabs voice helper (2026-11-23).
#   python scripts/el_voices.py mine [search]          voices in the account (voice_id, name, labels)
#   python scripts/el_voices.py library <search>       shared Voice Library (public_owner_id + voice_id)
#   python scripts/el_voices.py add <owner_id> <voice_id> <name>   add a library voice to the account
#   python scripts/el_voices.py say <voice_id> "<text>" [model] [out.mp3]   one test clip (costs credits)
#   python scripts/el_voices.py usage                  characters used / limit this period
import sys, os, json, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice_lines import el_request, tts_eleven

EL2 = "https://api.elevenlabs.io/v2"


def get(path, q=None, v2=False):
    import voice_lines as V
    old = V.EL_API
    if v2:
        V.EL_API = EL2
    try:
        st, data = el_request("GET", path, query=("?" + urllib.parse.urlencode(q)) if q else "")
    finally:
        V.EL_API = old
    if st != 200:
        raise SystemExit(f"{st}: {data[:300].decode('utf-8', 'replace')}")
    return json.loads(data)


cmd = sys.argv[1] if len(sys.argv) > 1 else "mine"
if cmd == "mine":
    q = {"page_size": 100, **({"search": sys.argv[2]} if len(sys.argv) > 2 else {})}
    for v in get("/voices", q, v2=True)["voices"]:
        print(f"{v['voice_id']}  {v['name']:<40} {v.get('category', '')}  {json.dumps(v.get('labels', {}))}")
elif cmd == "library":
    for v in get("/shared-voices", {"search": sys.argv[2], "page_size": 30})["voices"]:
        print(f"owner {v.get('public_owner_id')}  voice {v['voice_id']}  {v['name']:<36} "
              f"{v.get('gender', '')}/{v.get('accent', '')}/{v.get('age', '')}  {v.get('use_case', '')}")
elif cmd == "add":
    st, data = el_request("POST", f"/voices/add/{sys.argv[2]}/{sys.argv[3]}", {"new_name": sys.argv[4]})
    print(st, data[:300].decode("utf-8", "replace"))
elif cmd == "say":
    out = sys.argv[5] if len(sys.argv) > 5 else "out/el_test.mp3"
    if os.path.exists(out):
        os.remove(out)
    tts_eleven(sys.argv[3], sys.argv[2], sys.argv[4] if len(sys.argv) > 4 else "eleven_v4",
               {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True, "speed": 1.0}, out)
    print("wrote", out)
elif cmd == "usage":
    s = get("/user/subscription")
    print(f"tier {s.get('tier')}: {s.get('character_count')} / {s.get('character_limit')} characters used")
