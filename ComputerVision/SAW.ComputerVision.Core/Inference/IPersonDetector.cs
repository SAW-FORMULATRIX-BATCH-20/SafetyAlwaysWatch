using System.Collections.Generic;
using SAW.ComputerVision.Core.Models;

namespace SAW.ComputerVision.Core.Inference;

public interface IPersonDetector
{
    IEnumerable<Detection> Detect(float[] frameData, int width, int height);
}
