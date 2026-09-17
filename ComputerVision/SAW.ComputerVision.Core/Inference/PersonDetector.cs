using Microsoft.ML.OnnxRuntime;
using SAW.ComputerVision.Core.Models;
using System.Collections.Generic;

namespace SAW.ComputerVision.Core.Inference;

public class PersonDetector : OnnxModelWrapper
{
    public PersonDetector(string modelPath) : base(modelPath) { }

    public IEnumerable<Detection> Detect(float[] frameData, int width, int height)
    {
        if (Session == null) throw new System.InvalidOperationException("Model not loaded");
        
        // TODO: Implement actual tensor construction, Session.Run(), and output parsing
        // Example: 
        // var tensor = new Microsoft.ML.OnnxRuntime.Tensors.DenseTensor<float>(frameData, new[] { 1, 3, height, width });
        // var inputs = new List<NamedOnnxValue> { NamedOnnxValue.CreateFromTensor("images", tensor) };
        // using var results = Session.Run(inputs);
        // ... parse results ...

        return new List<Detection>();
    }
}
