"""Wait for a background process (a long render) without sleeping in the shell.
usage: python scripts/waitpid.py <pid> [max_seconds=580] [log_file]
Exits 0 when the process has ended, 3 when it is still running after max_seconds (call it again).
Prints the last 5 lines of log_file when given, so the agent never reads the whole log.
Start a render like:  nohup npx remotion render ... > out/<name>/render.log 2>&1 &  echo $!"""
import os, sys, time

pid = int(sys.argv[1]); limit = float(sys.argv[2]) if len(sys.argv) > 2 else 580; log = sys.argv[3] if len(sys.argv) > 3 else None
t0 = time.time()


def alive(p):
    try:
        os.kill(p, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True


while alive(pid) and time.time() - t0 < limit:
    time.sleep(5)
if log and os.path.exists(log):
    print("".join(open(log, errors="replace").read().replace("\r", "\n").splitlines(True)[-5:]))
running = alive(pid)
print(f"pid {pid}: {'STILL RUNNING' if running else 'done'} after {time.time() - t0:.0f} s")
sys.exit(3 if running else 0)
