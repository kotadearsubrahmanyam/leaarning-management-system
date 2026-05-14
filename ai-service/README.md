# LMS AI Microservice

This independent microservice provides:

- `POST /api/recommendations` — course recommendations for LMS users
- `POST /api/analytics` — smart analytics insights and engagement scoring
- `GET /api/health` — health check for service availability
- `GET /api/opencv-info` — optional OpenCV support status

## Stack

- FastAPI
- PyTorch
- Optional OpenCV support via `opencv-python`

## Run locally

This service requires Python 3.11 or 3.12 on Windows. Python 3.14 is not supported for the current package set because `pydantic-core` may fall back to a source build and require Visual C++ / Rust tooling.

If Python is not installed, use:

```powershell
winget install --id Python.Python.3.11 -e
```

Then use one of these verification commands:

```powershell
python --version
# or if the python alias is not available
py -3.11 --version
```

Create the virtual env and install dependencies:

```powershell
cd ai-service
./setup.ps1
```

If `torch` fails to install, use the CPU wheel for Windows:

```powershell
python -m pip install torch==2.11.0+cpu -f https://download.pytorch.org/whl/torch_stable.html
```

If you see a Torch warning about missing NumPy, install NumPy as well:

```powershell
python -m pip install numpy
```

If you are on Python 3.14 and cannot switch versions, install the Visual Studio Build Tools with C++ support and a Rust toolchain, but the recommended path is Python 3.11 or 3.12.

### Windows helper setup

```powershell
cd ai-service
./setup.ps1
./run.ps1
```

The service will start on `http://localhost:8001`.

## Example requests

### Course recommendations

```js
const response = await fetch("http://localhost:8001/api/recommendations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: "user-123",
    completed_courses: ["course-python-data"],
    interests: ["machine learning", "data"],
    preferred_levels: ["Intermediate"],
  }),
});
const data = await response.json();
```

### Smart analytics

```js
const response = await fetch("http://localhost:8001/api/analytics", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: "user-123",
    recent_activity: ["completed quiz", "watched video"],
    time_spent_minutes: 95,
    quiz_scores: [82, 90, 76],
  }),
});
const data = await response.json();
```

## Integration notes

- This service is intentionally independent from the LMS core API.
- Do not modify existing LMS core API routes.
- Call this service from the Next.js backend or middleware using its own base URL, e.g. `http://localhost:8001`.
- If you want to enable optional computer vision features, install `opencv-python`.
