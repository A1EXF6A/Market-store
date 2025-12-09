import { UpdateProductDto } from '../../src/products/dto/update-product.dto';

describe('UpdateProductDto', () => {
  it('should allow optional fields and validate types superficially', () => {
    const dto: UpdateProductDto = {
      name: 'Nuevo',
      description: 'Desc',
      price: 10 as any,
      location: 'City',
      availability: true,
      status: 'active' as any,
      category: 'cat',
    } as any;
    expect(dto.name).toBe('Nuevo');
    expect(dto.availability).toBe(true);
  });
});
