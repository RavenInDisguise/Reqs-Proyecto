--------------------------------------------------------------------------
-- Autor:       Paúl Rodríguez García
-- Fecha:       2023-05-18
-- Descripción: Procedimiento que elimina un cubículo y retorna la lista
--              de los correos electrónicos de los estudiantes con
--              reservas activas
--------------------------------------------------------------------------

CREATE OR ALTER PROCEDURE [dbo].[BiblioTEC_SP_EliminarCubiculo]
    @IN_idCubiculo          INT
AS
BEGIN
    SET NOCOUNT ON;         -- No retorna metadatos

    -- CONTROL DE ERRORES
    DECLARE @ErrorNumber INT, @ErrorSeverity INT, @ErrorState INT, @Message VARCHAR(200);
    DECLARE @transaccion_iniciada BIT = 0;

    -- DECLARACIÓN DE VARIABLES
    DECLARE @DESCRIPCION_ELIMINADO VARCHAR(32) = 'Eliminado';
    DECLARE @ID_ELIMINADO INT = NULL;
    DECLARE @salida TABLE (
        correo  VARCHAR(128)
    );

    BEGIN TRY

        -- VALIDACIONES
        
        -- Busca el ID del estado que corresponde a los eliminados
        SELECT  @ID_ELIMINADO = COALESCE(EC.[id], NULL)
        FROM    [dbo].[EstadosCubiculo] EC
        WHERE   EC.[descripcion] = @DESCRIPCION_ELIMINADO;

        -- Verifica si existe
        IF NOT EXISTS ( SELECT  1
                        FROM    [dbo].[Cubiculos] C
                        INNER JOIN  [dbo].[EstadosCubiculo] EC
                            ON  C.[idEstado] = EC.[id]
                        WHERE   C.[id] = @IN_idCubiculo
                            AND EC.[id] != @ID_ELIMINADO )
        BEGIN
            RAISERROR('No existe ningún cubículo con el ID %d', 16, 1, @IN_idCubiculo);
        END;

        -- Guarda los correos de los usuarios con reservas activas
        INSERT INTO @salida ([correo])
        SELECT  U.[correo]
        FROM    [dbo].[Usuarios] U
        INNER JOIN  [dbo].[Estudiantes] E
            ON  E.[idUsuario] = U.[id]
        INNER JOIN  [dbo].[Reservas] R
            ON  R.[idEstudiante] = E.[id]
        WHERE   R.[idCubiculo] = @IN_idCubiculo
            AND R.[activo] = 1
            AND R.[horaInicio] > GETUTCDATE();

        -- INICIO DE LA TRANSACCIÓN
        IF @@TRANCOUNT = 0
        BEGIN
            SET @transaccion_iniciada = 1;
            BEGIN TRANSACTION;
        END;

            UPDATE  C
            SET     C.[idEstado] = 5
            FROM    [dbo].[Cubiculos] C
            WHERE   C.[id] = @IN_idCubiculo;

            UPDATE  R
            SET     R.[activo] = 0,
                    R.[confirmado] = 0
            FROM    [dbo].[Reservas] R
            WHERE   R.[idCubiculo] = @IN_idCubiculo
                AND R.[horaInicio] > GETUTCDATE();

        -- COMMIT DE LA TRANSACCIÓN
        IF @transaccion_iniciada = 1
        BEGIN
            COMMIT TRANSACTION;
        END;

        -- Devuelve los correos
        SELECT  S.[correo]
        FROM    @salida S;

    END TRY
    BEGIN CATCH

        SET @ErrorNumber = ERROR_NUMBER();
        SET @ErrorSeverity = ERROR_SEVERITY();
        SET @ErrorState = ERROR_STATE();
        SET @Message = ERROR_MESSAGE();

        IF @transaccion_iniciada = 1
        BEGIN
            ROLLBACK TRANSACTION;
        END;

        IF @ErrorNumber != 50000
        BEGIN
            -- Si no es un error personalizado, se registra el error
            INSERT INTO [dbo].[Errors]
            VALUES (
                SUSER_NAME(),
                ERROR_NUMBER(),
                ERROR_STATE(),
                ERROR_SEVERITY(),
                ERROR_LINE(),
                ERROR_PROCEDURE(),
                ERROR_MESSAGE(),
                GETUTCDATE()
            );
        END;

        RAISERROR('%s - Error Number: %i', 
            @ErrorSeverity, @ErrorState, @Message, @ErrorNumber);

    END CATCH;
END;