import type { Product } from "@/types";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import ImageUpload from "@components/ui/image-upload";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UpdateProductData } from "@services/products";
import { productsService } from "@services/products";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const productSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "Máximo 200 caracteres"),
  description: z.string().optional(),
  price: z.number().min(0, "El precio debe ser mayor a 0").optional(),
  location: z.string().max(150, "Máximo 150 caracteres").optional(),
  type: z.enum(["product", "service"]).refine((val) => val, {
    message: "Selecciona un tipo",
  }),
  workingHours: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const EditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = React.useState(true);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [images, setImages] = React.useState<File[]>([]);
  const [existingImages, setExistingImages] = React.useState<string[]>([]);
  const [removedImages, setRemovedImages] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const selectedType = watch("type");

  const handleExistingImageRemove = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
    setRemovedImages((prev) => [...prev, url]);
  };

  React.useEffect(() => {
    const loadProduct = async () => {
      if (!id) {
        toast.error("ID de producto no válido");
        navigate("/my-products");
        return;
      }

      try {
        setIsLoadingProduct(true);
        const productData = await productsService.getById(Number(id));
        setProduct(productData);

        // Load existing images
        const imageUrls = productData.photos.map((photo) => photo.url);
        setExistingImages(imageUrls);

        // Populate form with existing data
        reset({
          name: productData.name,
          description: productData.description || "",
          price: productData.price,
          location: productData.location || "",
          type: productData.type,
          workingHours: productData.service?.workingHours || "",
        });
      } catch (error: any) {
        toast.error("Error al cargar el producto");
        navigate("/my-products");
      } finally {
        setIsLoadingProduct(false);
      }
    };

    loadProduct();
  }, [id, navigate, reset]);

  const onSubmit = async (data: ProductFormData) => {
    if (!id) return;

    try {
      setIsLoading(true);
      const updateData: UpdateProductData = {
        name: data.name,
        description: data.description,
        price: data.price,
        location: data.location,
        type: data.type,
        workingHours: data.workingHours,
        images: images.length > 0 ? images : undefined,
        removedImages: removedImages.length > 0 ? removedImages : undefined,
      };

      await productsService.update(Number(id), updateData);
      toast.success("Producto actualizado exitosamente");
      navigate("/my-products");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error al actualizar el producto",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando producto...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Producto no encontrado</p>
        <Button asChild className="mt-4">
          <Link to="/my-products">Volver a Mis Productos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/my-products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Editar Producto</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Información del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                placeholder="Ej: iPhone 15 Pro Max"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) =>
                  setValue("type", value as "product" | "service")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Producto</SelectItem>
                  <SelectItem value="service">Servicio</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe tu producto o servicio..."
                rows={4}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Imágenes del Producto</Label>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                existingImages={existingImages}
                onExistingImageRemove={handleExistingImageRemove}
                maxImages={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Precio (opcional)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  placeholder="Ciudad, región..."
                  {...register("location")}
                />
                {errors.location && (
                  <p className="text-sm text-red-600">
                    {errors.location.message}
                  </p>
                )}
              </div>
            </div>

            {selectedType === "service" && (
              <div className="space-y-2">
                <Label htmlFor="workingHours">Horario de Atención</Label>
                <Input
                  id="workingHours"
                  placeholder="Ej: Lunes a Viernes 9:00 AM - 6:00 PM"
                  {...register("workingHours")}
                />
                {errors.workingHours && (
                  <p className="text-sm text-red-600">
                    {errors.workingHours.message}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Actualizar Producto
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/my-products">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProductPage;
