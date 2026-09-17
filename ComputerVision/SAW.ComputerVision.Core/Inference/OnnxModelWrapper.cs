using Microsoft.ML.OnnxRuntime;
using SAW.ComputerVision.Core.Models;

namespace SAW.ComputerVision.Core.Inference;

public abstract class OnnxModelWrapper : IDisposable
{
    protected InferenceSession? Session;
    public string ModelPath { get; }

    protected OnnxModelWrapper(string modelPath)
    {
        ModelPath = modelPath;
    }

    public virtual void Load()
    {
        Session = new InferenceSession(ModelPath);
    }

    public void Dispose()
    {
        Session?.Dispose();
    }
}
