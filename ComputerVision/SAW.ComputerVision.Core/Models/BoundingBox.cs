namespace SAW.ComputerVision.Core.Models;

public readonly struct BoundingBox
{
    public double X { get; }
    public double Y { get; }
    public double Width { get; }
    public double Height { get; }

    public BoundingBox(double x, double y, double width, double height)
    {
        X = x;
        Y = y;
        Width = width;
        Height = height;
    }

    public double Area => Width * Height;

    public double CalculateIou(BoundingBox other)
    {
        var xA = Math.Max(X, other.X);
        var yA = Math.Max(Y, other.Y);
        var xB = Math.Min(X + Width, other.X + other.Width);
        var yB = Math.Min(Y + Height, other.Y + other.Height);

        var interArea = Math.Max(0, xB - xA) * Math.Max(0, yB - yA);

        if (interArea == 0) return 0;

        var boxAArea = Area;
        var boxBArea = other.Area;

        var iou = interArea / (boxAArea + boxBArea - interArea);
        return iou;
    }

    public double CalculateIoa(BoundingBox container)
    {
        var xA = Math.Max(X, container.X);
        var yA = Math.Max(Y, container.Y);
        var xB = Math.Min(X + Width, container.X + container.Width);
        var yB = Math.Min(Y + Height, container.Y + container.Height);

        var interArea = Math.Max(0, xB - xA) * Math.Max(0, yB - yA);

        if (interArea == 0) return 0;

        return interArea / Area;
    }
}
