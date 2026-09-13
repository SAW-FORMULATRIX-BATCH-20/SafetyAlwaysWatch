import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { App } from "../../App";
import { createMockSawService } from "../../services/saw-service";
import { FaceEnrollment } from "./FaceEnrollment";
import { CameraCaptureError, type BrowserCameraAdapter } from "./camera";

describe("Face Enrollment", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("lets an Admin/Safety Officer enroll an uploaded JPEG and immediately shows privacy-safe metadata", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(
      <App
        initialEntries={["/employees/EMP-07/face-enrollment"]}
        initialPersona="admin"
        service={createMockSawService({ storage: window.localStorage })}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Face Enrollment" })).toBeInTheDocument();
    expect(screen.getByText("Employee Warehouse 03")).toBeInTheDocument();
    expect(screen.getByText("EMP-07")).toBeInTheDocument();
    expect(screen.getByText(/JPEG or PNG/)).toBeInTheDocument();

    const image = new File(["demo-image"], "employee.jpg", { type: "image/jpeg" });
    await user.upload(screen.getByLabelText("Upload a JPEG or PNG image"), image);
    expect(screen.getByText("Preview ready for confirmation.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm Face Enrollment" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Face Sample enrolled successfully");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    expect(screen.getByText("Face Sample 1")).toBeInTheDocument();
    expect(screen.getByText(/Active · Enrolled/)).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /preview/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Back to Employee details" }));
    expect(await screen.findByRole("region", { name: "Employee details" })).toHaveTextContent("Enrolled");
  });

  it("requests the camera only after selection, captures through the device seam, and stops tracks when cancelled", async () => {
    const user = userEvent.setup();
    const stop = vi.fn();
    const camera: BrowserCameraAdapter = {
      start: vi.fn(async () => ({
        stream: { getTracks: () => [{ stop }] } as unknown as MediaStream,
        capture: async () => new File(["camera"], "capture.jpg", { type: "image/jpeg" }),
        stop,
      })),
    };
    render(
      <MemoryRouter initialEntries={["/employees/EMP-07/face-enrollment"]}>
        <Routes><Route element={<FaceEnrollment camera={camera} service={createMockSawService({ storage: null })} />} path="/employees/:employeeId/face-enrollment" /></Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: "Face Enrollment" });
    expect(camera.start).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Use camera" }));
    expect(camera.start).toHaveBeenCalledOnce();
    await user.click(await screen.findByRole("button", { name: "Capture image" }));
    expect(screen.getByText("Preview ready for confirmation.")).toBeInTheDocument();
    expect(stop).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cancel Face Enrollment" }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("keeps upload available when camera permission is denied and blocks non-images before processing", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const service = createMockSawService({ storage: null });
    const camera: BrowserCameraAdapter = { start: async () => { throw new CameraCaptureError("camera_permission_denied"); } };
    render(
      <MemoryRouter initialEntries={["/employees/EMP-07/face-enrollment"]}>
        <Routes><Route element={<FaceEnrollment camera={camera} service={service} />} path="/employees/:employeeId/face-enrollment" /></Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: "Face Enrollment" });
    await user.click(screen.getByRole("button", { name: "Use camera" }));
    expect(await screen.findByRole("status")).toHaveTextContent("permission was denied");
    await user.upload(screen.getByLabelText("Upload a JPEG or PNG image"), new File(["not-image"], "notes.txt", { type: "text/plain" }));
    expect(screen.getByRole("status")).toHaveTextContent("Choose a JPEG or PNG");
    await user.upload(screen.getByLabelText("Upload a JPEG or PNG image"), new File(["image"], "employee.png", { type: "image/png" }));
    expect(screen.getByRole("button", { name: "Confirm Face Enrollment" })).toBeInTheDocument();
  });

  it("releases a preview when switching camera sources, validation fails, or the route unmounts", async () => {
    const user = userEvent.setup();
    const camera: BrowserCameraAdapter = { start: async () => { throw new CameraCaptureError("camera_unavailable"); } };
    const view = render(
      <MemoryRouter initialEntries={["/employees/EMP-07/face-enrollment"]}>
        <Routes><Route element={<FaceEnrollment camera={camera} service={createMockSawService({ storage: null })} />} path="/employees/:employeeId/face-enrollment" /></Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: "Face Enrollment" });
    await user.upload(screen.getByLabelText("Upload a JPEG or PNG image"), new File(["image"], "employee.jpg", { type: "image/jpeg" }));
    await user.click(screen.getByRole("button", { name: "Use camera" }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    await user.upload(screen.getByLabelText("Upload a JPEG or PNG image"), new File(["image"], "employee.jpg", { type: "image/jpeg" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Demo validation outcome (demo only)" }), "no_face");
    await user.click(screen.getByRole("button", { name: "Confirm Face Enrollment" }));
    expect(await screen.findByRole("status")).toHaveTextContent("No face was found");
    await user.upload(screen.getByLabelText("Upload a JPEG or PNG image"), new File(["final-image"], "final.jpg", { type: "image/jpeg" }));
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("stops an active camera stream when Face Enrollment is cancelled or unmounted", async () => {
    const user = userEvent.setup();
    const cancelStop = vi.fn();
    const unmountStop = vi.fn();
    const camera: BrowserCameraAdapter = {
      start: vi.fn()
        .mockResolvedValueOnce({ stream: { getTracks: () => [{ stop: cancelStop }] } as unknown as MediaStream, capture: async () => new File([], "unused.jpg", { type: "image/jpeg" }), stop: cancelStop })
        .mockResolvedValueOnce({ stream: { getTracks: () => [{ stop: unmountStop }] } as unknown as MediaStream, capture: async () => new File([], "unused.jpg", { type: "image/jpeg" }), stop: unmountStop }),
    };
    const cancelView = render(
      <MemoryRouter initialEntries={["/employees/EMP-07/face-enrollment"]}>
        <Routes><Route element={<FaceEnrollment camera={camera} service={createMockSawService({ storage: null })} />} path="/employees/:employeeId/face-enrollment" /></Routes>
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Face Enrollment" });
    await user.click(screen.getByRole("button", { name: "Use camera" }));
    await user.click(screen.getByRole("button", { name: "Cancel Face Enrollment" }));
    expect(cancelStop).toHaveBeenCalled();
    cancelView.unmount();

    const unmountView = render(
      <MemoryRouter initialEntries={["/employees/EMP-07/face-enrollment"]}>
        <Routes><Route element={<FaceEnrollment camera={camera} service={createMockSawService({ storage: null })} />} path="/employees/:employeeId/face-enrollment" /></Routes>
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Face Enrollment" });
    await user.click(screen.getByRole("button", { name: "Use camera" }));
    unmountView.unmount();
    expect(unmountStop).toHaveBeenCalled();
  });

  it.each(["hrd", "supervisor"] as const)("restricts direct Face Enrollment access for the %s persona", (persona) => {
    render(<App initialEntries={["/employees/EMP-07/face-enrollment"]} initialPersona={persona} service={createMockSawService({ storage: null })} />);
    expect(screen.getByRole("heading", { name: "Restricted access" })).toBeInTheDocument();
  });

  it("shows an actionable error for a direct route to an unknown Employee", async () => {
    render(<App initialEntries={["/employees/not-an-employee/face-enrollment"]} initialPersona="admin" service={createMockSawService({ storage: null })} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("could not be found");
  });

  it("requires confirmation for deactivation and permits a replacement Face Sample afterwards", async () => {
    const user = userEvent.setup();
    const service = createMockSawService({ storage: null });
    await service.enrollFaceSample({ employeeId: "EMP-07", image: new File(["first"], "first.jpg", { type: "image/jpeg" }), demoOutcome: "success", actor: "Admin/Safety Officer" });
    render(<App initialEntries={["/employees/EMP-07/face-enrollment"]} initialPersona="admin" service={service} />);

    await screen.findByRole("heading", { name: "Face Enrollment" });
    await user.click(screen.getByRole("button", { name: "Deactivate Face Sample 1" }));
    expect(screen.getByRole("dialog", { name: "Confirm Face Sample deactivation" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText(/1 of 5 active Face Samples/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Deactivate Face Sample 1" }));
    await user.click(screen.getByRole("button", { name: "Deactivate Face Sample" }));
    expect(await screen.findByRole("status")).toHaveTextContent("deactivated");
    expect(screen.getByText(/0 of 5 active Face Samples/)).toBeInTheDocument();
    await user.upload(screen.getByLabelText("Upload a JPEG or PNG image"), new File(["replacement"], "replacement.jpg", { type: "image/jpeg" }));
    expect(screen.getByRole("button", { name: "Confirm Face Enrollment" })).toBeInTheDocument();
  });
});
