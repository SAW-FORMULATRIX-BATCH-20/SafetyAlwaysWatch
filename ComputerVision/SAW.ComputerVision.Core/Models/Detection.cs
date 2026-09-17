namespace SAW.ComputerVision.Core.Models;

public class Detection
{
    public BoundingBox Box { get; }
    public double Confidence { get; }
    public int ClassId { get; }

    public Detection(BoundingBox box, double confidence, int classId = 0)
    {
        Box = box;
        Confidence = confidence;
        ClassId = classId;
    }
}
