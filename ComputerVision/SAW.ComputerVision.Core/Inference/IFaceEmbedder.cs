namespace SAW.ComputerVision.Core.Inference;

public interface IFaceEmbedder
{
    float[] GetEmbedding(float[] faceCropData, int width, int height);
}
