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
import { Switch } from "@components/ui/switch"; // ⬅️ Toggle
import type { CreateProductData } from "@services/products";
import { productsService } from "@services/products";
import {
  ArrowLeft,
  Save,
  MapPin,
  Image as ImageIcon,
  Zap,
  Sparkles,
  Tag,
  Coins,
} from "lucide-react";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import LocationPicker from "@/components/LocationPicker";

// ---------- Schema (precio como string en el form) ----------
const productSchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre es requerido")
      .max(200, "Máximo 200 caracteres"),
    description: z.string().optional(),
    category: z.string().max(100, "Máximo 100 caracteres").optional(),
    price: z
      .string()
      .optional()
      .refine(
        (v) =>
          v === undefined ||
          v.trim() === "" ||
          (!Number.isNaN(Number(v)) && Number(v) >= 0),
        { message: "El precio debe ser un número mayor o igual a 0" },
      ),
    location: z
      .string()
      .trim()
      .min(1, "Selecciona una ubicación (desde el mapa o escribe una dirección)")
      .max(150, "Máximo 150 caracteres"),
    type: z.enum(["product", "service"] as const, {
      message: "Selecciona un tipo",
    }),
    workingHours: z.string().optional(),
  })
  .refine((d) => (d.type === "service" ? !!d.workingHours?.trim() : true), {
    message: "El horario es requerido para servicios",
    path: ["workingHours"],
  });

type ProductFormData = z.infer<typeof productSchema>;

const LS_KEY = "animatedBg:enabled";

const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [images, setImages] = React.useState<File[]>([]);

  const [mapLocation, setMapLocation] = React.useState<{
    address: string;
    lat: number;
    lng: number;
  } | null>(null);

  // 🔁 Toggle de fondo animado con persistencia
  const [bgOn, setBgOn] = React.useState<boolean>(() => {
    const saved = localStorage.getItem(LS_KEY);
    return saved === null ? true : saved === "true";
  });
  React.useEffect(() => {
    localStorage.setItem(LS_KEY, String(bgOn));
  }, [bgOn]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      type: "product",
      price: "",
      location: "",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);

      const priceNumber =
        data.price === undefined || data.price.trim() === ""
          ? undefined
          : Number(data.price);

      const createData: CreateProductData = {
        name: data.name,
        description: data.description || undefined,
        category: data.category || undefined,
        price: priceNumber,
        location: data.location,
        type: data.type,
        workingHours:
          data.type === "service" ? data.workingHours || undefined : undefined,
        images,
      };

      await productsService.create(createData);
      toast.success("¡Producto publicado con éxito!");
      navigate("/my-products");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Error al crear el producto",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      {/* ====== CAPAS DE FONDO ANIMADAS (condicionales) ====== */}
      {bgOn && (
        <>
          {/* Gradiente animado principal */}
          <div
            className="pointer-events-none absolute inset-0 -z-20 animate-[bgshift_16s_ease-in-out_infinite] opacity-95"
            style={{
              background:
                "radial-gradient(1200px 1200px at 10% -10%, rgba(147, 51, 234, .35), transparent 50%)," +
                "radial-gradient(1100px 1000px at 110% 10%, rgba(79, 70, 229, .35), transparent 55%)," +
                "radial-gradient(800px 900px at 50% 110%, rgba(236, 72, 153, .28), transparent 60%)",
            }}
          />

          {/* Rejilla sutil */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
              backgroundSize: "32px 32px, 32px 32px",
            }}
          />

          {/* Noise */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.6'/></svg>\")",
              backgroundSize: "300px 300px",
            }}
          />

          {/* Blobs flotantes */}
          <div className="pointer-events-none absolute -top-20 -left-20 h-[380px] w-[380px] -z-10 rounded-full blur-3xl opacity-50 animate-[blob_22s_ease-in-out_infinite] bg-fuchsia-400/35"></div>
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-[420px] w-[420px] -z-10 rounded-full blur-3xl opacity-50 animate-[blob_18s_ease-in-out_infinite_alternate] bg-indigo-400/35"></div>
        </>
      )}

      {/* ====== HEADER/HERO ====== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-lg">
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 3px, transparent 3px), radial-gradient(circle at 80% 30%, white 3px, transparent 3px), radial-gradient(circle at 40% 80%, white 3px, transparent 3px)",
            backgroundSize: "42px 42px",
          }}
        />

        <div className="relative px-5 py-6 md:px-8 md:py-8 text-white flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="bg-white/15 hover:bg-white/25 backdrop-blur"
            >
              <Link to="/my-products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Crear Producto / Servicio
            </h1>
          </div>

          {/* 🔘 Toggle Fondo animado */}
          <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-2 backdrop-blur">
            <Zap className="h-4 w-4" />
            <span className="text-sm">Fondo animado</span>
            <Switch
              checked={bgOn}
              onCheckedChange={setBgOn}
              aria-label="Activar fondo animado"
            />
          </div>
        </div>
      </div>

      {/* ====== CONTENIDO ====== */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
        {/* Formulario */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur dark:bg-neutral-950/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Información del anuncio</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Básicos */}
              <div className="rounded-xl border p-4 md:p-6 bg-gradient-to-b from-white/80 to-transparent dark:from-neutral-950/80 dark:to-transparent">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <div className="relative">
                      <Input
                        id="name"
                        placeholder="Ej: iPhone 15 Pro Max"
                        className="pl-10"
                        {...register("name")}
                      />
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-600">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo *</Label>
                    <Controller
                      control={control}
                      name="type"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="hover:border-indigo-500/60 focus:ring-indigo-500/30">
                            <SelectValue placeholder="Selecciona el tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">Producto</SelectItem>
                            <SelectItem value="service">Servicio</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.type && (
                      <p className="text-sm text-red-600">
                        {errors.type.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-5">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe tu producto o servicio..."
                    rows={4}
                    className="resize-none hover:border-fuchsia-500/60 focus:ring-fuchsia-500/30"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 mt-5">
                  <Label htmlFor="category">Categoría</Label>
                  <Input
                    id="category"
                    placeholder="Ej: Electrónicos, Ropa, Servicios..."
                    className="hover:border-violet-500/60 focus:ring-violet-500/30"
                    {...register("category")}
                  />
                  {errors.category && (
                    <p className="text-sm text-red-600">
                      {errors.category.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Imágenes */}
              <div className="rounded-xl border p-4 md:p-6 bg-white/70 dark:bg-neutral-950/60">
                <div className="flex items-center gap-2 mb-3">
                  <div className="rounded-md bg-indigo-600/10 p-2">
                    <ImageIcon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h3 className="font-medium">Imágenes</h3>
                </div>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  maxImages={5}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Sube hasta 5 imágenes. Formatos admitidos: JPG, PNG, WEBP.
                </p>
              </div>

              {/* Precio + Ubicación */}
              <div className="rounded-xl border p-4 md:p-6 bg-white/70 dark:bg-neutral-950/60 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio (opcional)</Label>
                    <div className="relative">
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10 hover:border-emerald-500/60 focus:ring-emerald-500/30"
                        {...register("price")}
                      />
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-red-600">
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        className="pl-9 hover:border-sky-500/60 focus:ring-sky-500/30"
                        placeholder="Selecciona en el mapa o escribe una dirección"
                        {...register("location")}
                      />
                    </div>
                    {errors.location && (
                      <p className="text-sm text-red-600">
                        {errors.location.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mapa */}
                <div className="space-y-2">
                  <LocationPicker
                    value={mapLocation ?? undefined}
                    onChange={(val) => {
                      setMapLocation(val);
                      setValue("location", val.address, {
                        shouldValidate: true,
                      });
                    }}
                    height={340}
                  />
                  <p className="text-xs text-muted-foreground">
                    Toca el mapa para fijar la ubicación o escribe manualmente
                    la dirección arriba.
                  </p>
                </div>
              </div>

              {/* Horario (solo services) */}
              {selectedType === "service" && (
                <div className="rounded-xl border p-4 md:p-6 bg-white/70 dark:bg-neutral-950/60">
                  <div className="space-y-2">
                    <Label htmlFor="workingHours">Horario de Atención *</Label>
                    <Input
                      id="workingHours"
                      placeholder="Ej: Lunes a Viernes 09:00 - 18:00"
                      className="hover:border-rose-500/60 focus:ring-rose-500/30"
                      {...register("workingHours")}
                    />
                    {errors.workingHours && (
                      <p className="text-sm text-red-600">
                        {errors.workingHours.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isLoading ? (
                      "Creando..."
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Crear Producto
                      </>
                    )}
                  </span>
                  {/* Shine */}
                  <span className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity">
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[btnshine_1.6s_ease-in-out]" />
                  </span>
                </Button>

                <Button type="button" variant="outline" asChild>
                  <Link to="/my-products">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview lateral */}
        <Card className="border-0 shadow-xl bg-gradient-to-b from-fuchsia-50/80 to-white/80 dark:from-neutral-900/70 dark:to-neutral-950/70 sticky top-4 h-max backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Vista previa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Imagen cover */}
            <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900 flex items-center justify-center">
              {images?.length ? (
                <img
                  src={URL.createObjectURL(images[0])}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  Añade imágenes para ver la portada
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xl font-semibold truncate">
                {watch("name") || "Nombre del producto"}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {watch("category") || "Categoría"}
              </div>
              <div className="text-sm text-emerald-600 font-medium">
                {watch("price")
                  ? `USD ${Number(watch("price")).toLocaleString()}`
                  : "—"}
              </div>
              <div className="text-sm text-sky-600 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">
                  {watch("location") || "Ubicación"}
                </span>
              </div>
            </div>

            <div className="rounded-lg border p-3 bg-white/60 dark:bg-neutral-900/60 text-xs text-muted-foreground">
              Consejo: los anuncios con fotos nítidas y una descripción clara
              reciben hasta 3× más visitas.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== KEYFRAMES LOCALES ====== */}
      <style>{`
        @keyframes btnshine {
          0%   { transform: translateX(-120%); }
          60%  { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -10px) scale(1.05); }
          50% { transform: translate(-10px, 10px) scale(0.98); }
          75% { transform: translate(10px, 20px) scale(1.02); }
        }
        @keyframes bgshift {
          0% { filter: hue-rotate(0deg) saturate(1); }
          50% { filter: hue-rotate(20deg) saturate(1.1); }
          100% { filter: hue-rotate(0deg) saturate(1); }
        }
      `}</style>
    </div>
  );
};

export default CreateProductPage;
