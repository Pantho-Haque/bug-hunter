---
meta:
  contentType: Evidence
  evidenceId: E-01
  phase: 1
  status: Awaiting Phase 2 measurements
---

# Record a device benchmark

Duplicate the result section for each physical device and browser combination. Follow the protocol in the [device and browser matrix](../../phase-1/DEVICE_BROWSER_MATRIX.md).

## Result

- Evidence run ID:
- Date and tester:
- Physical device or emulator:
- Device tier:
- Manufacturer and model:
- CPU, memory, and GPU:
- Operating system and version:
- Browser and exact version:
- Display resolution and scale:
- Input devices:
- Power and thermal state:
- Network profile:
- Quality tier:
- Reduced motion:
- Browser zoom:

| Measurement | Result | Pass threshold | Pass or fail |
|---|---:|---:|---|
| Time to usable shell |  | Record baseline |  |
| Cold mission load |  | At most 10 seconds |  |
| Warm mission load |  | At most 5 seconds |  |
| Median FPS |  | At least 30 FPS |  |
| One-percent-low FPS |  | No sustained result below 20 FPS |  |
| Longest ordinary-play task |  | At most 200 ms |  |
| Runner cancellation |  | Editing immediately available |  |
| Trace hash |  | Matches reference |  |
| Final-state hash |  | Matches reference |  |

### Functional observations

- Editor typing while scene animates:
- Camera and Coding View:
- Pause, Step, Restart Scene, and repeat Run:
- Offline reload:
- Storage-full recovery:
- 200 percent zoom:
- Keyboard-only path:
- Touch path, if applicable:
- Screen reader pairing, if applicable:
- WebGL context loss or console errors:

### Attachments

- Performance trace:
- Screenshots or video:
- Browser console export:
- Test fixture version or commit:

### Conclusion

- Overall result: Pass | Conditional | Fail
- Blocking defects:
- Decision records affected:
- Required rerun:

