sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"br/com/idxtecTransferenciaPropriedade/helpers/ProdutoHelpDialog",
	"br/com/idxtecTransferenciaPropriedade/helpers/LoteArmazenagemHelpDialog",
	"br/com/idxtecTransferenciaPropriedade/helpers/ContratoCompraHelpDialog",
	"br/com/idxtecTransferenciaPropriedade/services/Session"
], function(Controller, History, MessageBox, JSONModel, ProdutoHelpDialog, LoteArmazenagemHelpDialog,
	ContratoCompraHelpDialog, Session) {
	"use strict";

	return Controller.extend("br.com.idxtecTransferenciaPropriedade.controller.GravarTransferencia", {
		onInit: function(){
			var oRouter = this.getOwnerComponent().getRouter();
			
			oRouter.getRoute("gravartransferencia").attachMatched(this._routerMatch, this);
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			
			this._operacao = null;
			this._sPath = null;
			
			var oJSONModel = new JSONModel();
			this.getOwnerComponent().setModel(oJSONModel,"model");
		},
		
		getModel : function(sModel) {
			return this.getOwnerComponent().getModel(sModel);	
		},
		
		loteOrigemReceived: function() {
			this.getView().byId("loteorigem").setSelectedKey(this.getModel("model").getProperty("/LoteOrigem"));
		},
		
		loteDestinoReceived: function() {
			this.getView().byId("lotedestino").setSelectedKey(this.getModel("model").getProperty("/LoteDestino"));
		},
		
		produtoReceived: function() {
			this.getView().byId("produto").setSelectedKey(this.getModel("model").getProperty("/Produto"));
		},
		
		contratoReceived: function() {
			this.getView().byId("contrato").setSelectedKey(this.getModel("model").getProperty("/ContratoCompra"));
		},
		
		handleSearchLote1: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			LoteArmazenagemHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		handleSearchLote: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			LoteArmazenagemHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		handleSearchProduto: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			ProdutoHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		handleSearchContrato: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			ContratoCompraHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		_routerMatch: function(){
			var oParam = this.getOwnerComponent().getModel("parametros").getData();
			var oJSONModel = this.getOwnerComponent().getModel("model");
			var oModel = this.getOwnerComponent().getModel();
			var oViewModel = this.getOwnerComponent().getModel("view");
			
			this._operacao = oParam.operacao;
			this._sPath = oParam.sPath;
			
			this.getView().byId("loteorigem").setValue(null);
			this.getView().byId("lotedestino").setValue(null);
			this.getView().byId("produto").setValue(null);
			this.getView().byId("contrato").setValue(null);
			
			if (this._operacao === "incluir"){
				
				oViewModel.setData({
					titulo: "Inserir Transferência de Propriedade"
				});
			
				var oNovoTransferencia = {
					"Id": 0,
					"Data": new Date(),
					"LoteOrigem": 0,
					"LoteDestino": 0,
					"Produto": 0,
					"Quantidade": 0.00,
					"ContratoCompra": "",
					"Observacoes": "",
					"Encerrada": false,
					"Empresa" : Session.get("EMPRESA_ID"),
					"Usuario": Session.get("USUARIO_ID"),
					"EmpresaDetails": { __metadata: { uri: "/Empresas(" + Session.get("EMPRESA_ID") + ")"}},
					"UsuarioDetails": { __metadata: { uri: "/Usuarios(" + Session.get("USUARIO_ID") + ")"}}
				};
				
				oJSONModel.setData(oNovoTransferencia);
				
			} else if (this._operacao === "editar"){
				
				oViewModel.setData({
					titulo: "Editar Transferência de Propriedade"
				});
				
				oModel.read(oParam.sPath,{
					success: function(oData) {
						oJSONModel.setData(oData);
					}
				});
			}
		},
		
		onSalvar: function(){
			if (this._checarCampos(this.getView())) {
				MessageBox.warning("Preencha todos os campos obrigatórios!");
				return;
			}
			
			if (this._operacao === "incluir") {
				this._createTransferencia();
			} else if (this._operacao === "editar") {
				this._updateTransferencia();
			}
		},
		
		_goBack: function(){
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			
			if (sPreviousHash !== undefined) {
					window.history.go(-1);
			} else {
				oRouter.navTo("transferencia", {}, true);
			}
		},
		
		_getDados: function(){
			var oJSONModel = this.getOwnerComponent().getModel("model");
			var oDados = oJSONModel.getData();
		
			oDados.LoteArmazenagemDetails1 = {
				__metadata: {
					uri: "/LoteArmazenagems(" + oDados.LoteOrigem + ")"
				}
			};
			
			oDados.LoteArmazenagemDetails = {
				__metadata: {
					uri: "/LoteArmazenagems(" + oDados.LoteDestino + ")"
				}
			};
			
			oDados.ProdutoDetails = {
				__metadata: {
					uri: "/Produtos(" + oDados.Produto + ")"
				}
			};
			
			oDados.ContratoCompraDetails = {
				__metadata: {
					uri: "/ContratoCompras('" + oDados.ContratoCompra + "')"
				}
			};
			
			return oDados;
		},
		
		_createTransferencia: function() {
			var oModel = this.getOwnerComponent().getModel();
			var that = this;

			oModel.create("/TransferenciaPropriedades", this._getDados(), {
				success: function() {
					MessageBox.success("Transferência inserida com sucesso!", {
						onClose: function(){
							that._goBack(); 
						}
					});
				}
			});
		},
		
		_updateTransferencia: function() {
			var oModel = this.getOwnerComponent().getModel();
			var that = this;
			
			oModel.update(this._sPath, this._getDados(), {
					success: function() {
					MessageBox.success("Transferência alterada com sucesso!", {
						onClose: function(){
							that._goBack();
						}
					});
				}
			});
		},
		
		_checarCampos: function(oView){
			if(oView.byId("loteorigem").getValue() === "" || oView.byId("lotedestino").getValue() === ""
			|| oView.byId("produto").getValue() === "" || oView.byId("quantidade").getValue() === ""){
				return true;
			} else{
				return false; 
			}
		},
		
		onVoltar: function(){
			this._goBack();
		}
	});

});