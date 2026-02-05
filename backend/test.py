import torch
import torchvision.models as models

model = models.resnet50(pretrained=True)
model.eval()

torch.save(model, "resnet50_classifier.pt")