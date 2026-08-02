package br.com.solve.central;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Impressão das propostas dentro do app.
 *
 * A WebView do Android ignora window.print() — não dá erro, simplesmente nada
 * acontece. Este plugin entrega a WebView ao serviço de impressão do sistema,
 * que abre o diálogo padrão do Android (com "Salvar como PDF") e renderiza
 * aplicando as regras @media print do index.css. Ou seja: o PDF sai igual ao
 * gerado no computador, sem duplicar o layout da proposta em código nativo.
 *
 * Chamado pelo JS em src/lib/native.js via registerPlugin('SolvePrinter').
 */
@CapacitorPlugin(name = "SolvePrinter")
public class SolvePrinterPlugin extends Plugin {

    @PluginMethod
    public void print(PluginCall call) {
        final String nome = call.getString("name", "documento");

        getActivity().runOnUiThread(() -> {
            try {
                PrintManager printManager =
                        (PrintManager) getContext().getSystemService(Context.PRINT_SERVICE);
                if (printManager == null) {
                    call.reject("Serviço de impressão indisponível neste aparelho");
                    return;
                }

                WebView webView = getBridge().getWebView();
                PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(nome);
                PrintAttributes atributos = new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build();

                printManager.print(nome, adapter, atributos);
                call.resolve();
            } catch (Exception e) {
                call.reject("Falha ao imprimir: " + e.getMessage(), e);
            }
        });
    }
}
