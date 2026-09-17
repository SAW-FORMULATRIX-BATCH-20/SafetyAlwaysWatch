using Microsoft.ML.OnnxRuntime;
using SAW.ComputerVision.Core.Models;
using System.Collections.Generic;

namespace SAW.ComputerVision.Core.Inference;

public class PpeDetector : OnnxModelWrapper, IPpeDetector
{
    public PpeDetector(string modelPath) : base(modelPath) { }

    public IEnumerable<Detection> Detect(float[] cropData, int width, int height)
    {
        if (Session == null) throw new System.InvalidOperationException("Model not loaded");

        // TODO: Implement actual tensor construction, Session.Run(), and output parsing

        return new List<Detection>();
    }
}
