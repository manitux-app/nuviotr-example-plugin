# NuvioTR plugin örnekleri

Bu depo, [NuvioTR](https://nuviotr.github.io/android-tv.html) uygulaması için plugin/uzantı geliştirme başlangıç noktasıdır. Pluginler katalog, arama, yayın bağlantısı ve isteğe bağlı yorum özellikleri sunabilir.

Orjinal Nuvio'da kataloglar sunucu tarafında addon/eklenti olarak çalışmak zorundadır. NuvioTR uygulamasında kendi plugin/uzantınızı kullanıcı tarafında çalışan, tek tek veya her ikisi olacak şekilde katalog/yayın özellikleriyle kullanabilirsiniz.

Eklenen yeni özellikler plugin'in orjinal Nuvio'da çalışmasını engellemez.

## Klasörler

- `example/`: Temel JavaScript plugin örneği. `manifest.json` plugini tanımlar; `example.js` katalog, arama, yayın, yorum ve ayar fonksiyonlarının örneklerini içerir.
- `rarefilm/`: Örneğe göre hazırlanmış gerçek bir plugin.
- `rarefilm/ts/`: Node.js tarafında geliştirilen TypeScript kaynak dosyalarıdır.
- `rarefilm/js/`: TypeScript dosyalarının derlenmiş JavaScript çıktısıdır. Manifest içindeki `filename` alanı bu dosyayı göstermelidir.


