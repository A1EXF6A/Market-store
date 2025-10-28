import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import ImageUpload from "@components/ui/image-upload";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { LocationSelector } from "@components/ui/location-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import type { CreateProductData } from "@services/products";
import { productsService } from "@services/products";
import { ArrowLeft, Save } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const productSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(200, "Máximo 200 caracteres"),
  description: z.string().optional(),
  category: z.string().max(100, "Máximo 100 caracteres").optional(),
  price: z.number().min(0, "El precio debe ser mayor a 0").optional(),
  location: z.string().max(150, "Máximo 150 caracteres").optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  type: z.enum(["product", "service"]).refine((val) => val, {
    message: "Selecciona un tipo",
  }),
  workingHours: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [images, setImages] = React.useState<File[]>([]);
  const [selectedLocation, setSelectedLocation] = React.useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      type: "product",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);
      const createData: CreateProductData = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        location: data.location,
        latitude: selectedLocation?.latitude,
        longitude: selectedLocation?.longitude,
        type: data.type,
        workingHours: data.workingHours,
        images: images,
      };

      await productsService.create(createData);
      toast.success("Producto creado exitosamente");
      navigate("/my-products");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Error al crear el producto",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (location: { latitude: number; longitude: number; address?: string } | null) => {
    setSelectedLocation(location);
    if (location?.address) {
      setValue("location", location.address);
    } else if (!location) {
      setValue("location", "");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/my-products">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Crear Producto</h1>
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
              <Label htmlFor="category">Categoría</Label>
              <Input
                id="category"
                placeholder="Ej: Electrónicos, Ropa, Servicios..."
                {...register("category")}
              />
              {errors.category && (
                <p className="text-sm text-red-600">
                  {errors.category.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Imágenes del Producto</Label>
              <ImageUpload
                images={images}
                onImagesChange={setImages}
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
                <Label>Ubicación</Label>
                <LocationSelector
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  placeholder="Seleccionar ubicación en el mapa"
                />
                <Input
                  placeholder="O escribe la ubicación..."
                  {...register("location")}
                  className="mt-2"
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
                  "Creando..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Crear Producto
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

export default CreateProductPage;
