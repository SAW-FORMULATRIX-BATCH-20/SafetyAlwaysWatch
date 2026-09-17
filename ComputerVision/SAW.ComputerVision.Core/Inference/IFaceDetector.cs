using System.Collections.Generic;
using SAW.ComputerVision.Core.Models;

namespace SAW.ComputerVision.Core.Inference;

public interface IFaceDetector
{
    IEnumerable<Detection> Detect(float[] cropData, int width, int height);
}
