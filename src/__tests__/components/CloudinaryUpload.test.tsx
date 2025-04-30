import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CloudinaryUpload, { ImageObject } from "@/components/ui/cloudinary-upload";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ src, alt, fill }: { src: string; alt: string; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} style={fill ? { objectFit: "cover" } : {}} data-testid="image" />
  ),
}));

// Mock the CldUploadWidget from next-cloudinary
vi.mock("next-cloudinary", () => ({
  CldUploadWidget: ({
    children,
    onSuccess,
  }: {
    children: (props: { open: () => void }) => React.ReactNode;
    onSuccess: (result: unknown) => void;
  }) => {
    // Simulate a function that would be called by the open method
    const mockUploadWidget = {
      open: () => {
        // Mock result from Cloudinary
        const mockResult = {
          info: {
            secure_url: "https://example.com/image.jpg",
            public_id: "test/image",
          },
        };
        onSuccess(mockResult);
      },
    };

    return <div data-testid="upload-widget">{children({ open: mockUploadWidget.open })}</div>;
  },
}));

// Mock the deleteCloudinaryImage service
vi.mock("@/services/cloudinary", () => ({
  deleteCloudinaryImage: vi.fn().mockResolvedValue({ success: true }),
}));

describe("CloudinaryUpload Component", () => {
  const mockOnChange = vi.fn();
  const mockOnRemove = vi.fn();
  const mockOnProfileSelect = vi.fn();
  let mockImages: ImageObject[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    mockImages = [
      {
        url: "https://example.com/image1.jpg",
        alt: "Image 1",
        public_id: "test/image1",
      },
      {
        url: "https://example.com/image2.jpg",
        alt: "Image 2",
        public_id: "test/image2",
      },
    ];
  });

  it("renders upload button when not at max images", () => {
    render(
      <CloudinaryUpload onChange={mockOnChange} onRemove={mockOnRemove} value={[]} maxImages={3} />
    );

    expect(screen.getByTestId("upload-widget")).toBeInTheDocument();
    expect(screen.getByText(/Subir imagen/i)).toBeInTheDocument();
  });

  it("does not render upload button when max images reached", () => {
    const maxImages = 2;
    render(
      <CloudinaryUpload
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        value={mockImages}
        maxImages={maxImages}
      />
    );

    expect(screen.queryByText(/Subir imagen/i)).not.toBeInTheDocument();
  });

  it("uploads an image when upload button is clicked", () => {
    render(<CloudinaryUpload onChange={mockOnChange} onRemove={mockOnRemove} value={[]} />);

    // Click the upload button
    const uploadButton = screen.getByText(/Subir imagen/i);
    fireEvent.click(uploadButton);

    // Verify that onChange was called with the expected values
    expect(mockOnChange).toHaveBeenCalledWith(
      "https://example.com/image.jpg",
      "image",
      "test/image"
    );
  });

  it("displays existing images", () => {
    render(<CloudinaryUpload onChange={mockOnChange} onRemove={mockOnRemove} value={mockImages} />);

    // Check that both images are rendered
    const images = screen.getAllByTestId("image");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", mockImages[0].url);
    expect(images[1]).toHaveAttribute("src", mockImages[1].url);
  });

  it("removes an image when the remove button is clicked", async () => {
    render(<CloudinaryUpload onChange={mockOnChange} onRemove={mockOnRemove} value={mockImages} />);

    // Encontrar y hacer clic en el primer botón de eliminar (no tiene texto, solo un ícono X)
    const buttons = screen.getAllByRole("button");
    // Los primeros dos botones son los de eliminar (uno para cada imagen)
    fireEvent.click(buttons[0]);

    // Esperar a que la eliminación asíncrona se complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockOnRemove).toHaveBeenCalledWith(mockImages[0].url);
  });

  it("supports profile image selection when enabled", () => {
    render(
      <CloudinaryUpload
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        value={mockImages}
        isProfileSelector={true}
        onProfileSelect={mockOnProfileSelect}
        profileImageIndex={-1} // No profile selected initially
      />
    );

    // Look for "Set as Profile" buttons
    const profileButtons = screen.getAllByText("Set as Profile");
    expect(profileButtons).toHaveLength(2);

    // Click the first "Set as Profile" button
    fireEvent.click(profileButtons[0]);
    expect(mockOnProfileSelect).toHaveBeenCalledWith(0);
  });

  it("shows profile indicator badge when an image is selected as profile", () => {
    render(
      <CloudinaryUpload
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        value={mockImages}
        isProfileSelector={true}
        onProfileSelect={mockOnProfileSelect}
        profileImageIndex={0} // First image is profile
      />
    );

    // Check that the profile badge is shown
    expect(screen.getByText("Profile")).toBeInTheDocument();

    // The second image should have "Set as Profile" button
    expect(screen.getByText("Set as Profile")).toBeInTheDocument();
  });

  it("sets first uploaded image as profile automatically when enabled", () => {
    render(
      <CloudinaryUpload
        onChange={mockOnChange}
        onRemove={mockOnRemove}
        value={[]}
        isProfileSelector={true}
        onProfileSelect={mockOnProfileSelect}
        profileImageIndex={-1}
      />
    );

    // Click the upload button
    const uploadButton = screen.getByText(/Subir imagen/i);
    fireEvent.click(uploadButton);

    // Verify that onChange was called
    expect(mockOnChange).toHaveBeenCalled();

    // Verify that onProfileSelect was called with index 0
    expect(mockOnProfileSelect).toHaveBeenCalledWith(0);
  });
});
