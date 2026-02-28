import sys
import json
import tempfile
import os

try:
    import cadquery as cq
except ImportError:
    print("ERROR: CadQuery is not installed. Please run: pip install cadquery", file=sys.stderr)
    sys.exit(1)

def build_profile(params):
    profileType = params.get('profileType', 'flat')
    length = float(params.get('length', 500))
    thickness = float(params.get('thickness', 10))
    
    if profileType == 'flat':
        w = float(params.get('width', 200))
        h = float(params.get('height', 150))
        r = float(params.get('holeRadius', 25))
        
        result = cq.Workplane("XY").box(w, h, thickness)
        if r > 0:
            result = result.faces(">Z").workplane().circle(r).cutThruAll()
        return result
        
    else:
        wH = float(params.get('webHeight', 100))
        fW = float(params.get('flangeWidth', 50))
        wT = float(params.get('webThickness', 5))
        fT = float(params.get('flangeThickness', 5))
        
        cx = -fW / 2.0
        cy = -wH / 2.0
        
        points = []
        if profileType == 'L-bracket':
            points = [
                (cx, cy),
                (cx + fW, cy),
                (cx + fW, cy + fT),
                (cx + wT, cy + fT),
                (cx + wT, cy + wH),
                (cx, cy + wH)
            ]
        elif profileType == 'U-channel':
            points = [
                (cx, cy),
                (cx + fW, cy),
                (cx + fW, cy + wH),
                (cx + fW - fT, cy + wH),
                (cx + fW - fT, cy + wT),
                (cx + fT, cy + wT),
                (cx + fT, cy + wH),
                (cx, cy + wH)
            ]
        elif profileType == 'I-beam':
            points = [
                (cx, cy),
                (cx + fW, cy),
                (cx + fW, cy + fT),
                (cx + fW/2 + wT/2, cy + fT),
                (cx + fW/2 + wT/2, cy + wH - fT),
                (cx + fW, cy + wH - fT),
                (cx + fW, cy + wH),
                (cx, cy + wH),
                (cx, cy + wH - fT),
                (cx + fW/2 - wT/2, cy + wH - fT),
                (cx + fW/2 - wT/2, cy + fT),
                (cx, cy + fT)
            ]
            
        return cq.Workplane("XY").polyline(points).close().extrude(length)

def main():
    if len(sys.argv) < 2:
        print("ERROR: Missing params JSON path", file=sys.stderr)
        sys.exit(1)

    json_path = sys.argv[1]
    with open(json_path, 'r') as f:
        params = json.load(f)

    try:
        result = build_profile(params)

        fd, path = tempfile.mkstemp(suffix='.step')
        os.close(fd)

        cq.exporters.export(result, path)
        print(path)
    except Exception as e:
        print(f"ERROR: Failed during CAD computation: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
