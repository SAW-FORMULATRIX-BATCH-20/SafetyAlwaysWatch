using Microsoft.ML.OnnxRuntime;
using SAW.ComputerVision.Core.Models;
using System;

namespace SAW.ComputerVision.Core.Inference;

public class FaceEmbedder : OnnxModelWrapper
{
    public FaceEmbedder(string modelPath) : base(modelPath) { }

    public float[] GetEmbedding(float[] faceCropData, int width, int height)
    {
        if (Session == null) throw new System.InvalidOperationException("Model not loaded");
        
        // TODO: Implement actual tensor construction, Session.Run(), and output parsing

        return Array.Empty<float>();
    }
}
